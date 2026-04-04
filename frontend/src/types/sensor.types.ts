// Shape data realtime dari WebSocket (sama persis dengan MqttPayloadDto di backend)
export interface SensorReading {
  id: number;
  deviceId: string;
  timestamp: string;
  tempC: number;
  rhPct: number;
  tvocPpb: number;
  eco2Ppm: number;
  dustUgm3: number;
  aqi: number;
  createdAt: string;
}

// Shape response dari GET /sensors/latest
export interface LatestReadingResponse {
  reading: SensorReading | null;
  connectedDevices: string[];
  lastUpdated: string | null;
}

// Shape response dari GET /sensors/readings
export interface ReadingsListResponse {
  data: SensorReading[];
  total: number;
  from: string | null;
  to: string | null;
}

// Shape response dari GET /sensors/stats
export interface SensorStats {
  totalReadings: number;
  lastUpdated: string | null;
  currentAqi: number | null;
  averages: {
    tempC: number | null;
    rhPct: number | null;
    tvocPpb: number | null;
    eco2Ppm: number | null;
    dustUgm3: number | null;
    aqi: number | null;
  };
  peaks: {
    maxAqi: number | null;
    minAqi: number | null;
    maxTvoc: number | null;
    maxDust: number | null;
  };
}

// AQI label dan warna — sesuai skala ENS160 (1–5)
export const AQI_CONFIG = {
  1: { label: "Good", color: "#00ff88", bg: "#003d1f" },
  2: { label: "Moderate", color: "#ffeb3b", bg: "#3d3500" },
  3: { label: "Unhealthy", color: "#ff9800", bg: "#3d2200" },
  4: { label: "Very Unhealthy", color: "#ff5722", bg: "#3d1100" },
  5: { label: "Hazardous", color: "#ff1744", bg: "#3d0008" },
} as const;

// Wrapped response envelope dari backend
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

// WebSocket event names — harus sama persis dengan backend WS_EVENTS
export const WS_EVENTS = {
  SENSOR_DATA: "sensor:data",
  SENSOR_LATEST: "sensor:latest",
  GET_LATEST: "sensor:get_latest",
  ERROR: "error",
} as const;
