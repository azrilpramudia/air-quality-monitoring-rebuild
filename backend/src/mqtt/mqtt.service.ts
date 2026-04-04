import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';
import { SensorService } from '../sensor/sensor.service';
import { WebsocketGateway } from '../websocket/ws.gateway';
import { MqttPayloadDto } from './dto/mqtt-payload.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient;

  // Interval untuk save ke DB (1 menit = 60_000 ms)
  private readonly DB_SAVE_INTERVAL_MS = 60_000;
  private lastSavedAt = 0;

  // Buffer menyimpan data terbaru dari ESP32
  // akan di-flush ke DB setiap 1 menit
  private latestPayload: MqttPayloadDto | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly sensorService: SensorService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  // ─────────────────────────────────────────
  //  Lifecycle — connect saat module init
  // ─────────────────────────────────────────
  onModuleInit() {
    this.connect();
  }

  // ─────────────────────────────────────────
  //  Lifecycle — disconnect saat app shutdown
  // ─────────────────────────────────────────
  onModuleDestroy() {
    if (this.client) {
      this.client.end();
      this.logger.log('MQTT client disconnected.');
    }
  }

  // ─────────────────────────────────────────
  //  Connect ke MQTT broker
  // ─────────────────────────────────────────
  private connect() {
    const brokerUrl = this.configService.getOrThrow<string>('MQTT_BROKER_URL');
    const clientId = this.configService.getOrThrow<string>('MQTT_CLIENT_ID');
    const topic = this.configService.getOrThrow<string>('MQTT_TOPIC');

    this.logger.log(`Connecting to MQTT broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      reconnectPeriod: 5000, // auto-reconnect setiap 5 detik jika putus
      connectTimeout: 10_000,
    });

    this.client.on('connect', () => {
      this.logger.log('MQTT connected!');
      this.subscribe(topic);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('MQTT reconnecting...');
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT error: ${err.message}`);
    });

    this.client.on('offline', () => {
      this.logger.warn('MQTT client offline.');
    });

    this.client.on('message', (receivedTopic, message) => {
      this.handleMessage(receivedTopic, message);
    });
  }

  // ─────────────────────────────────────────
  //  Subscribe ke topic
  // ─────────────────────────────────────────
  private subscribe(topic: string) {
    this.client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${topic}: ${err.message}`);
        return;
      }
      this.logger.log(`Subscribed to topic: ${topic}`);
    });
  }

  // ─────────────────────────────────────────
  //  Handle pesan masuk dari ESP32
  // ─────────────────────────────────────────
  private handleMessage(topic: string, message: Buffer) {
    let raw: unknown;

    // 1. Parse JSON — tolak jika malformed
    try {
      raw = JSON.parse(message.toString());
    } catch {
      this.logger.warn(`Invalid JSON on topic ${topic}: ${message.toString()}`);
      return;
    }

    // 2. Validasi struktur payload dengan DTO
    const dto = plainToInstance(MqttPayloadDto, raw);
    const errors = validateSync(dto);
    if (errors.length > 0) {
      this.logger.warn(
        `Payload validation failed: ${errors.map((e) => e.toString()).join(', ')}`,
      );
      return;
    }

    this.logger.debug(
      `[${dto.device_id}] AQI=${dto.aqi} TVOC=${dto.tvoc_ppb}ppb Dust=${dto.dust_ugm3}ug/m3`,
    );

    // 3. Simpan sebagai payload terbaru
    this.latestPayload = dto;

    // 4. Broadcast realtime ke semua client WebSocket (setiap data masuk ~5 detik)
    this.wsGateway.broadcastSensorData(dto);

    // 5. Simpan ke database setiap 1 menit (throttle)
    this.maybeSaveToDB(dto);
  }

  // ─────────────────────────────────────────
  //  Throttle save ke DB — hanya 1x per menit
  // ─────────────────────────────────────────
  private maybeSaveToDB(dto: MqttPayloadDto) {
    const now = Date.now();
    if (now - this.lastSavedAt < this.DB_SAVE_INTERVAL_MS) return;

    this.lastSavedAt = now;

    // Fire-and-forget dengan error handling agar tidak crash service
    this.sensorService.saveReading(dto).catch((err: Error) => {
      this.logger.error(`Failed to save reading to DB: ${err.message}`);
    });
  }

  // ─────────────────────────────────────────
  //  Getter untuk data terbaru (opsional — bisa dipakai controller)
  // ─────────────────────────────────────────
  getLatestPayload(): MqttPayloadDto | null {
    return this.latestPayload;
  }
}
