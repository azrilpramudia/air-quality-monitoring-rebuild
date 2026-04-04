import { Module } from '@nestjs/common';
import { WebsocketGateway } from './ws.gateway';

@Module({
  providers: [WebsocketGateway],
  exports: [WebsocketGateway], // di-export agar MqttService bisa inject gateway
})
export class WebsocketModule {}
