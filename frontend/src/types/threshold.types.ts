export interface ThresholdConfig {
  aqi: number; // default: 3
  tvocPpb: number; // default: 1000 ppb
  eco2Ppm: number; // default: 1200 ppm
  tempC: number; // default: 38 °C
  rhPct: number; // default: 85 %
  dustUgm3: number; // default: 50 µg/m³
}

export interface ActiveAlert {
  id: string;
  metric: keyof ThresholdConfig;
  label: string;
  value: number;
  threshold: number;
  unit: string;
  triggeredAt: Date;
}
