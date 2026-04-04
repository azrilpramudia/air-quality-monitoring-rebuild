import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { SensorService } from './sensor.service';
import { GetReadingsQueryDto } from './dto/sensor.dto';

@Controller('sensors')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  // ─────────────────────────────────────────
  //  GET /sensors/latest
  //  Ambil reading terbaru — semua device
  // ─────────────────────────────────────────
  @Get('latest')
  @HttpCode(HttpStatus.OK)
  getLatest() {
    return this.sensorService.getLatestReading();
  }

  // ─────────────────────────────────────────
  //  GET /sensors/latest/:deviceId
  //  Ambil reading terbaru — device tertentu
  // ─────────────────────────────────────────
  @Get('latest/:deviceId')
  @HttpCode(HttpStatus.OK)
  getLatestByDevice(@Param('deviceId') deviceId: string) {
    return this.sensorService.getLatestReading(deviceId);
  }

  // ─────────────────────────────────────────
  //  GET /sensors/stats
  //  Statistik ringkas — semua device
  // ─────────────────────────────────────────
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.sensorService.getStats();
  }

  // ─────────────────────────────────────────
  //  GET /sensors/stats/:deviceId
  //  Statistik ringkas — device tertentu
  // ─────────────────────────────────────────
  @Get('stats/:deviceId')
  @HttpCode(HttpStatus.OK)
  getStatsByDevice(@Param('deviceId') deviceId: string) {
    return this.sensorService.getStats(deviceId);
  }

  // ─────────────────────────────────────────
  //  GET /sensors/readings?from=&to=&limit=&deviceId=
  //
  //  Contoh:
  //  /sensors/readings?from=2026-03-31T00:00:00Z&to=2026-03-31T23:59:59Z
  //  /sensors/readings?deviceId=esp32-01-client-io&limit=50
  // ─────────────────────────────────────────
  @Get('readings')
  @HttpCode(HttpStatus.OK)
  getReadings(@Query() query: GetReadingsQueryDto) {
    return this.sensorService.getReadings(query);
  }

  // ─────────────────────────────────────────
  //  GET /sensors/readings/:id
  //  Ambil satu reading by ID
  //  ParseIntPipe otomatis validasi & cast string → number
  // ─────────────────────────────────────────
  @Get('readings/:id')
  @HttpCode(HttpStatus.OK)
  getReadingById(@Param('id', ParseIntPipe) id: number) {
    return this.sensorService.getReadingById(id);
  }
}
