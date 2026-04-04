import {
  IsNumber,
  IsString,
  IsInt,
  Min,
  Max,
  IsPositive,
} from 'class-validator';

/**
 * Validasi struktur payload JSON dari ESP32.
 * Jika field tidak sesuai, pesan akan ditolak di MqttService
 * sebelum menyentuh database atau WebSocket.
 *
 * Contoh payload dari ESP32:
 * {
 *   "ts": 1711880400,
 *   "temp_c": 31.72,
 *   "rh_pct": 71.0,
 *   "tvoc_ppb": 903,
 *   "eco2_ppm": 950,
 *   "dust_ugm3": 0.0,
 *   "aqi": 3,
 *   "device_id": "esp32-01-client-io"
 * }
 */
export class MqttPayloadDto {
  @IsPositive()
  @IsNumber()
  ts: number; // Unix timestamp (epoch seconds)

  @IsNumber()
  @Min(-40)
  @Max(85)
  temp_c: number; // Suhu dalam Celsius

  @IsNumber()
  @Min(0)
  @Max(100)
  rh_pct: number; // Kelembaban relatif dalam %

  @IsInt()
  @Min(0)
  @Max(65000)
  tvoc_ppb: number; // Total VOC dalam ppb

  @IsInt()
  @Min(400)
  @Max(65000)
  eco2_ppm: number; // Equivalent CO2 dalam ppm

  @IsNumber()
  @Min(0)
  dust_ugm3: number; // Konsentrasi debu dalam ug/m3

  @IsInt()
  @Min(1)
  @Max(5)
  aqi: number; // AQI skala ENS160 (1–5)

  @IsString()
  device_id: string; // ID unik perangkat ESP32
}
