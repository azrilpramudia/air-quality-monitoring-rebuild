import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { SensorModule } from './sensor/sensor.module';
import { MqttModule } from './mqtt/mqtt.module';
import { WebsocketModule } from './websocket/ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    CommonModule,

    PrismaModule,

    SensorModule,
    WebsocketModule,
    MqttModule,
  ],
})
export class AppModule {}
