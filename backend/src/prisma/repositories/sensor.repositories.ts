import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SensorReading, Device, Prisma } from '@prisma/client';

export interface CreateReadingInput {
  deviceId: string;
  timestamp: Date;
  tempC: number;
  rhPct: number;
  tvocPpb: number;
  eco2Ppm: number;
  dustUgm3: number;
  aqi: number;
}

export interface HistoryQueryParams {
  deviceId: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface AggregatedReading {
  timestamp: Date;
  avgTempC: number;
  avgRhPct: number;
  avgTvocPpb: number;
  avgEco2Ppm: number;
  avgDustUgm3: number;
  avgAqi: number;
}

@Injectable()
export class SensorRepository {
  private readonly logger = new Logger(SensorRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Upsert device — buat jika belum ada ──────────────────────────
  async upsertDevice(deviceId: string): Promise<Device> {
    return this.prisma.device.upsert({
      where: { deviceId },
      update: {},
      create: { deviceId },
    });
  }

  // ── Simpan satu reading ───────────────────────────────────────────
  async createReading(data: CreateReadingInput): Promise<SensorReading> {
    return this.prisma.sensorReading.create({ data });
  }

  // ── Ambil reading terbaru per device ─────────────────────────────
  async findLatestByDevice(deviceId: string): Promise<SensorReading | null> {
    return this.prisma.sensorReading.findFirst({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── Ambil data historis dengan filter waktu & limit ──────────────
  async findHistory(params: HistoryQueryParams): Promise<SensorReading[]> {
    const { deviceId, from, to, limit = 100 } = params;

    const where: Prisma.SensorReadingWhereInput = {
      deviceId,
      ...(from || to
        ? {
            timestamp: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    return this.prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  // ── Hitung rata-rata per jam untuk chart ─────────────────────────
  async findHourlyAggregates(
    deviceId: string,
    from: Date,
    to: Date,
  ): Promise<AggregatedReading[]> {
    // Raw query karena Prisma belum support DATE_FORMAT aggregate
    const rows = await this.prisma.$queryRaw<
      Array<{
        hour: Date;
        avg_temp: number;
        avg_rh: number;
        avg_tvoc: number;
        avg_eco2: number;
        avg_dust: number;
        avg_aqi: number;
      }>
    >`
      SELECT
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') AS hour,
        AVG(temp_c)    AS avg_temp,
        AVG(rh_pct)    AS avg_rh,
        AVG(tvoc_ppb)  AS avg_tvoc,
        AVG(eco2_ppm)  AS avg_eco2,
        AVG(dust_ugm3) AS avg_dust,
        AVG(aqi)       AS avg_aqi
      FROM sensor_readings
      WHERE device_id = ${deviceId}
        AND timestamp BETWEEN ${from} AND ${to}
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
      ORDER BY hour ASC
    `;

    return rows.map((row) => ({
      timestamp: new Date(row.hour),
      avgTempC: Number(row.avg_temp),
      avgRhPct: Number(row.avg_rh),
      avgTvocPpb: Number(row.avg_tvoc),
      avgEco2Ppm: Number(row.avg_eco2),
      avgDustUgm3: Number(row.avg_dust),
      avgAqi: Number(row.avg_aqi),
    }));
  }

  // ── Hitung jumlah reading dalam rentang waktu ────────────────────
  async countReadings(deviceId: string, from: Date, to: Date): Promise<number> {
    return this.prisma.sensorReading.count({
      where: {
        deviceId,
        timestamp: { gte: from, lte: to },
      },
    });
  }

  // ── Ambil semua device yang terdaftar ────────────────────────────
  async findAllDevices(): Promise<Device[]> {
    return this.prisma.device.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }
}
