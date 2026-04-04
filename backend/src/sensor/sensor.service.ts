import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MqttPayloadDto } from '../mqtt/dto/mqtt-payload.dto';
import {
  GetReadingsQueryDto,
  SensorReadingResponseDto,
  LatestReadingResponseDto,
  ReadingsListResponseDto,
} from './dto/sensor.dto';

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  //  Simpan satu reading ke DB
  //  Dipanggil oleh MqttService setiap 1 menit
  // ─────────────────────────────────────────
  async saveReading(
    payload: MqttPayloadDto,
  ): Promise<SensorReadingResponseDto> {
    await this.prisma.device.upsert({
      where: { deviceId: payload.device_id },
      update: {},
      create: { deviceId: payload.device_id },
    });

    const reading = await this.prisma.sensorReading.create({
      data: {
        deviceId: payload.device_id,
        timestamp: new Date(payload.ts * 1000),
        tempC: payload.temp_c,
        rhPct: payload.rh_pct,
        tvocPpb: payload.tvoc_ppb,
        eco2Ppm: payload.eco2_ppm,
        dustUgm3: payload.dust_ugm3,
        aqi: payload.aqi,
      },
    });

    this.logger.log(
      `Saved reading — device: ${payload.device_id} | AQI: ${payload.aqi} | ts: ${reading.timestamp.toISOString()}`,
    );

    return this.toResponseDto(reading);
  }

  // ─────────────────────────────────────────
  //  Ambil data historis dengan filter
  //  GET /api/v1/sensors/readings
  // ─────────────────────────────────────────
  async getReadings(
    query: GetReadingsQueryDto,
  ): Promise<ReadingsListResponseDto> {
    const { from, to, limit = 100, deviceId } = query;

    if (from && to && new Date(from) > new Date(to)) {
      throw new BadRequestException('from date must be earlier than to date');
    }

    const where: Prisma.SensorReadingWhereInput = {};

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (from || to) {
      where.timestamp = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const data = await this.prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });

    const total = await this.prisma.sensorReading.count({ where });

    return {
      data: data.map((r) => this.toResponseDto(r)),
      total,
      from: from ? new Date(from) : null,
      to: to ? new Date(to) : null,
    };
  }

  // ─────────────────────────────────────────
  //  Ambil reading terbaru per device
  //  GET /api/v1/sensors/latest
  // ─────────────────────────────────────────
  async getLatestReading(deviceId?: string): Promise<LatestReadingResponseDto> {
    const where: Prisma.SensorReadingWhereInput = deviceId ? { deviceId } : {};

    const reading = await this.prisma.sensorReading.findFirst({
      where,
      orderBy: { timestamp: 'desc' },
    });

    const devices = await this.prisma.device.findMany({
      select: { deviceId: true },
    });

    return {
      reading: reading ? this.toResponseDto(reading) : null,
      connectedDevices: devices.map((d) => d.deviceId),
      lastUpdated: reading?.timestamp ?? null,
    };
  }

  // ─────────────────────────────────────────
  //  Ambil satu reading by ID
  //  GET /api/v1/sensors/readings/:id
  // ─────────────────────────────────────────
  async getReadingById(id: number): Promise<SensorReadingResponseDto> {
    const reading = await this.prisma.sensorReading.findUnique({
      where: { id },
    });

    if (!reading) {
      throw new NotFoundException(`Reading with id ${id} not found`);
    }

    return this.toResponseDto(reading);
  }

  // ─────────────────────────────────────────
  //  Statistik ringkas untuk dashboard
  //  GET /api/v1/sensors/stats
  // ─────────────────────────────────────────
  async getStats(deviceId?: string): Promise<Record<string, unknown>> {
    const where: Prisma.SensorReadingWhereInput = deviceId ? { deviceId } : {};

    const avgResult = await this.prisma.sensorReading.aggregate({
      where,
      _avg: {
        tempC: true,
        rhPct: true,
        tvocPpb: true,
        eco2Ppm: true,
        dustUgm3: true,
        aqi: true,
      },
      _max: { aqi: true, tvocPpb: true, dustUgm3: true },
      _min: { aqi: true },
    });

    const totalCount = await this.prisma.sensorReading.count({ where });

    const latestReading = await this.prisma.sensorReading.findFirst({
      where,
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, aqi: true },
    });

    return {
      totalReadings: totalCount,
      lastUpdated: latestReading?.timestamp ?? null,
      currentAqi: latestReading?.aqi ?? null,
      averages: {
        tempC: this.round(avgResult._avg.tempC),
        rhPct: this.round(avgResult._avg.rhPct),
        tvocPpb: this.round(avgResult._avg.tvocPpb),
        eco2Ppm: this.round(avgResult._avg.eco2Ppm),
        dustUgm3: this.round(avgResult._avg.dustUgm3),
        aqi: this.round(avgResult._avg.aqi),
      },
      peaks: {
        maxAqi: avgResult._max.aqi,
        minAqi: avgResult._min.aqi,
        maxTvoc: avgResult._max.tvocPpb,
        maxDust: avgResult._max.dustUgm3,
      },
    };
  }

  // ─────────────────────────────────────────
  //  Private helpers
  // ─────────────────────────────────────────

  // Map Prisma model → Response DTO
  // Memisahkan shape DB dari shape API response
  private toResponseDto(reading: {
    id: number;
    deviceId: string;
    timestamp: Date;
    tempC: number;
    rhPct: number;
    tvocPpb: number;
    eco2Ppm: number;
    dustUgm3: number;
    aqi: number;
    createdAt: Date;
  }): SensorReadingResponseDto {
    return {
      id: reading.id,
      deviceId: reading.deviceId,
      timestamp: reading.timestamp,
      tempC: reading.tempC,
      rhPct: reading.rhPct,
      tvocPpb: reading.tvocPpb,
      eco2Ppm: reading.eco2Ppm,
      dustUgm3: reading.dustUgm3,
      aqi: reading.aqi,
      createdAt: reading.createdAt,
    };
  }

  // Bulatkan angka ke 2 desimal, handle null dari aggregate
  private round(value: number | null, decimals = 2): number | null {
    if (value === null) return null;
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
  }
}
