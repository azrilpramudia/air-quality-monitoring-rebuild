/* eslint-disable react-hooks/purity */
import { useQuery } from "@tanstack/react-query";
import { sensorApi } from "@/src/lib/api";
import type { ReadingsListResponse } from "@/src/types/sensor.types";

interface UseSensorHistoryParams {
  from?: string;
  to?: string;
  limit?: number;
  deviceId?: string;
  enabled?: boolean;
}

// ─────────────────────────────────────────
//  useSensorHistory
//
// ─────────────────────────────────────────
export function useSensorHistory({
  from,
  to,
  limit = 100,
  deviceId,
  enabled = true,
}: UseSensorHistoryParams = {}) {
  return useQuery<ReadingsListResponse>({
    queryKey: ["sensor-history", { from, to, limit, deviceId }],

    queryFn: () => sensorApi.getReadings({ from, to, limit, deviceId }),

    enabled,

    staleTime: 5 * 60 * 1000, // 5 menit
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });
}

// ─────────────────────────────────────────
//  useSensorHistoryLast24h
//
// ─────────────────────────────────────────
export function useSensorHistoryLast24h(deviceId?: string) {
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return useSensorHistory({
    from,
    to,
    limit: 288,
    deviceId,
  });
}
