import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { MqttPayloadDto } from '../mqtt/dto/mqtt-payload.dto';

// Event name constants — satu sumber kebenaran,
// sama persis yang dipakai di frontend
export const WS_EVENTS = {
  // Server → Client
  SENSOR_DATA: 'sensor:data', // broadcast data realtime tiap 5 detik
  SENSOR_LATEST: 'sensor:latest', // response untuk permintaan data terbaru
  ERROR: 'error', // error notification ke client

  // Client → Server
  GET_LATEST: 'sensor:get_latest', // client minta data terbaru saat pertama connect
} as const;

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/ws', // endpoint: ws://localhost:3001/ws
  transports: ['websocket'], // hanya pakai WebSocket, bukan long-polling
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  private server: Server;

  // Cache data terbaru — dikirim ke client baru yang baru connect
  private latestData: MqttPayloadDto | null = null;

  // Track jumlah client yang terkoneksi
  private connectedClients = 0;

  constructor(private readonly configService: ConfigService) {}

  // ─────────────────────────────────────────
  //  Lifecycle — setelah gateway init
  // ─────────────────────────────────────────
  afterInit() {
    this.logger.log('WebSocket Gateway initialized at namespace /ws');
  }

  // ─────────────────────────────────────────
  //  Event — client baru connect
  // ─────────────────────────────────────────
  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(
      `Client connected: ${client.id} | total: ${this.connectedClients}`,
    );

    // Langsung kirim data terbaru ke client yang baru connect
    // agar dashboard tidak kosong saat pertama dibuka
    if (this.latestData) {
      client.emit(WS_EVENTS.SENSOR_LATEST, this.latestData);
    }
  }

  // ─────────────────────────────────────────
  //  Event — client disconnect
  // ─────────────────────────────────────────
  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id} | total: ${this.connectedClients}`,
    );
  }

  // ─────────────────────────────────────────
  //  Event — client meminta data terbaru secara eksplisit
  //  Berguna saat frontend reconnect atau tab kembali aktif
  // ─────────────────────────────────────────
  @SubscribeMessage(WS_EVENTS.GET_LATEST)
  handleGetLatest(@ConnectedSocket() client: Socket) {
    if (this.latestData) {
      client.emit(WS_EVENTS.SENSOR_LATEST, this.latestData);
    } else {
      client.emit(WS_EVENTS.ERROR, { message: 'No data available yet' });
    }
  }

  // ─────────────────────────────────────────
  //  Broadcast — dipanggil oleh MqttService setiap data baru masuk
  //  Mengirim ke SEMUA client yang sedang terkoneksi
  // ─────────────────────────────────────────
  broadcastSensorData(data: MqttPayloadDto): void {
    // Update cache
    this.latestData = data;

    // Tidak perlu broadcast jika tidak ada yang mendengarkan
    if (this.connectedClients === 0) return;

    this.server.emit(WS_EVENTS.SENSOR_DATA, data);

    this.logger.debug(
      `Broadcast to ${this.connectedClients} client(s) — AQI: ${data.aqi}`,
    );
  }

  // ─────────────────────────────────────────
  //  Getter — dipakai oleh SensorController jika perlu
  // ─────────────────────────────────────────
  getConnectedClientsCount(): number {
    return this.connectedClients;
  }
}
