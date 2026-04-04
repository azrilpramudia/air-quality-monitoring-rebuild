import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorModule } from '../sensor/sensor.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    SensorModule, // untuk simpan data ke DB
    WebsocketModule, // untuk broadcast realtime ke frontend
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
