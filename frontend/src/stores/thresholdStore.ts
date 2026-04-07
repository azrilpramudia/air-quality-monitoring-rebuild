import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ThresholdConfig, ActiveAlert } from "@/src/types/threshold.types";

interface ThresholdState {
  thresholds: ThresholdConfig;
  enabled: boolean;

  activeAlerts: ActiveAlert[];

  lastAlertAt: Partial<Record<keyof ThresholdConfig, number>>;
}

interface ThresholdActions {
  setThreshold: (metric: keyof ThresholdConfig, value: number) => void;
  setEnabled: (enabled: boolean) => void;
  addAlert: (alert: ActiveAlert) => void;
  dismissAlert: (id: string) => void;
  dismissAll: () => void;
  setLastAlertAt: (metric: keyof ThresholdConfig, ts: number) => void;
  resetThresholds: () => void;
}

// ─────────────────────────────────────────
//  Default thresholds Standar ENS160
// ─────────────────────────────────────────
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  aqi: 3,
  tvocPpb: 1000,
  eco2Ppm: 1200,
  tempC: 38,
  rhPct: 85,
  dustUgm3: 50,
};

export const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export const useThresholdStore = create<ThresholdState & ThresholdActions>()(
  persist(
    (set) => ({
      thresholds: DEFAULT_THRESHOLDS,
      enabled: true,
      activeAlerts: [],
      lastAlertAt: {},

      setThreshold: (metric, value) =>
        set((s) => ({
          thresholds: { ...s.thresholds, [metric]: value },
        })),

      setEnabled: (enabled) => set({ enabled }),

      addAlert: (alert) =>
        set((s) => ({
          // Maksimal 10 alert aktif sekaligus — buang yang paling lama
          activeAlerts: [alert, ...s.activeAlerts].slice(0, 10),
        })),

      dismissAlert: (id) =>
        set((s) => ({
          activeAlerts: s.activeAlerts.filter((a) => a.id !== id),
        })),

      dismissAll: () => set({ activeAlerts: [] }),

      setLastAlertAt: (metric, ts) =>
        set((s) => ({
          lastAlertAt: { ...s.lastAlertAt, [metric]: ts },
        })),

      resetThresholds: () => set({ thresholds: DEFAULT_THRESHOLDS }),
    }),
    {
      name: "aq-thresholds", // key di localStorage
      // Hanya persist threshold config dan enabled — bukan activeAlerts
      partialize: (s) => ({
        thresholds: s.thresholds,
        enabled: s.enabled,
      }),
    },
  ),
);
