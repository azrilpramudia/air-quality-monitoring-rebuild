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

export const WS_EVENTS = {
  SENSOR_DATA: 'sensor:data',
  SENSOR_LATEST: 'sensor:latest',
  ERROR: 'error',

  GET_LATEST: 'sensor:get_latest',
} as const;

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket'],
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  private server: Server;

  private latestData: MqttPayloadDto | null = null;

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

  @SubscribeMessage(WS_EVENTS.GET_LATEST)
  handleGetLatest(@ConnectedSocket() client: Socket) {
    if (this.latestData) {
      client.emit(WS_EVENTS.SENSOR_LATEST, this.latestData);
    } else {
      client.emit(WS_EVENTS.ERROR, { message: 'No data available yet' });
    }
  }

  broadcastSensorData(data: MqttPayloadDto): void {
    this.latestData = data;

    if (this.connectedClients === 0) return;

    this.server.emit(WS_EVENTS.SENSOR_DATA, data);

    this.logger.debug(
      `Broadcast to ${this.connectedClients} client(s) — AQI: ${data.aqi}`,
    );
  }

  getConnectedClientsCount(): number {
    return this.connectedClients;
  }
}
