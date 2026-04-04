import { Module } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { SensorController } from './sensor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SensorService],
  controllers: [SensorController],
  exports: [SensorService], // di-export agar MqttService bisa inject
})
export class SensorModule {}
