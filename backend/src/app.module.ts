import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SensorModule } from './sensor/sensor.module';
import { MqttModule } from './mqtt/mqtt.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Load .env global, tersedia di seluruh app
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SensorModule,
    MqttModule,
    WebsocketModule,
  ],
})
export class AppModule {}
