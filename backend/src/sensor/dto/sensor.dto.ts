import {
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─────────────────────────────────────────
//  Query DTO — parameter untuk GET /readings
// ─────────────────────────────────────────
export class GetReadingsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

// ─────────────────────────────────────────
//  Response DTO — shape data yang dikirim ke frontend
// ─────────────────────────────────────────
export class SensorReadingResponseDto {
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
}

export class LatestReadingResponseDto {
  reading: SensorReadingResponseDto | null;
  connectedDevices: string[];
  lastUpdated: Date | null;
}

export class ReadingsListResponseDto {
  data: SensorReadingResponseDto[];
  total: number;
  from: Date | null;
  to: Date | null;
}
