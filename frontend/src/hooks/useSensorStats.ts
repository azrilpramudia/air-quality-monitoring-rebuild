import { useQuery } from "@tanstack/react-query";
import { sensorApi } from "@../../../src/lib/api";
import { useSensorStore } from "@../../../src/stores/sensorStore";
import type { SensorStats } from "@../../../src/types/sensor.types";

// ─────────────────────────────────────────
//  useSensorStats
//
// ─────────────────────────────────────────
export function useSensorStats(deviceId?: string) {
  return useQuery<SensorStats>({
    queryKey: ["sensor-stats", deviceId],

    queryFn: () => sensorApi.getStats(deviceId),

    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// ─────────────────────────────────────────
//  useSensorLatest
//
// ─────────────────────────────────────────
export function useSensorLatest(deviceId?: string) {
  const setConnectedDevices = useSensorStore.getState().setConnectedDevices;

  return useQuery({
    queryKey: ["sensor-latest", deviceId],

    queryFn: async () => {
      const data = await sensorApi.getLatest();
      // Sync connected devices ke Zustand store
      setConnectedDevices(data.connectedDevices);
      return data;
    },

    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
}
