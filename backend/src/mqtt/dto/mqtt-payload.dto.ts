import {
  IsNumber,
  IsString,
  IsInt,
  Min,
  Max,
  IsPositive,
} from 'class-validator';

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
