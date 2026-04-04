import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { SensorModule } from './sensor/sensor.module';
import { MqttModule } from './mqtt/mqtt.module';
import { WebsocketModule } from './websocket/ws.module';

@Module({
  imports: [
    // 1. Config — harus paling atas agar .env tersedia di semua module
    ConfigModule.forRoot({ isGlobal: true }),

    // 2. Common — global filter & interceptor, berlaku di seluruh app
    CommonModule,

    // 3. Prisma — shared DB client
    PrismaModule,

    // 4. Feature modules
    SensorModule,
    WebsocketModule,
    MqttModule, // paling akhir karena depend on Sensor & Websocket
  ],
})
export class AppModule {}
