/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";
import type {
  ApiResponse,
  LatestReadingResponse,
  ReadingsListResponse,
  SensorStats,
} from "@/src/types/sensor.types";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.success) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export const sensorApi = {
  getLatest: () =>
    apiClient.get<LatestReadingResponse>("/sensors/latest").then((r) => r.data),

  getLatestByDevice: (deviceId: string) =>
    apiClient
      .get<LatestReadingResponse>(`/sensors/latest/${deviceId}`)
      .then((r) => r.data),

  getStats: (deviceId?: string) =>
    apiClient
      .get<SensorStats>(
        deviceId ? `/sensors/stats/${deviceId}` : "/sensors/stats",
      )
      .then((r) => r.data),

  getReadings: (params?: {
    from?: string;
    to?: string;
    limit?: number;
    deviceId?: string;
  }) =>
    apiClient
      .get<ReadingsListResponse>("/sensors/readings", { params })
      .then((r) => r.data),
};
