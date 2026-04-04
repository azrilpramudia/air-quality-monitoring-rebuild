import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SensorRepository } from './repositories/sensor.repositories';

// @Global() agar PrismaService & SensorRepository tidak perlu
// di-import satu per satu di setiap module lain
@Global()
@Module({
  providers: [PrismaService, SensorRepository],
  exports: [PrismaService, SensorRepository],
})
export class PrismaModule {}
