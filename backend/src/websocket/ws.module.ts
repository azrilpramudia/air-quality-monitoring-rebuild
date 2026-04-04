import { Module } from '@nestjs/common';
import { WebsocketGateway } from './ws.gateway';

@Module({
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
