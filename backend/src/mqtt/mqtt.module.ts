import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorModule } from '../sensor/sensor.module';
import { WebsocketModule } from '../websocket/ws.module';

@Module({
  imports: [SensorModule, WebsocketModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
