import { useEffect, useRef } from "react";
import { useSensorStore, selectLatest } from "@/src/stores/sensorStore";
import { ThresholdConfig, ActiveAlert } from "@/src/types/threshold.types";
import {
  useThresholdStore,
  ALERT_COOLDOWN_MS,
} from "@/src/stores/thresholdStore";

// Label dan unit per metric untuk pesan notifikasi
const METRIC_META: Record<
  keyof ThresholdConfig,
  { label: string; unit: string }
> = {
  aqi: { label: "AQI", unit: "" },
  tvocPpb: { label: "TVOC", unit: "ppb" },
  eco2Ppm: { label: "eCO₂", unit: "ppm" },
  tempC: { label: "Temperature", unit: "°C" },
  rhPct: { label: "Humidity", unit: "%" },
  dustUgm3: { label: "Dust", unit: "µg/m³" },
};

// Map metric store key → SensorReading key
const METRIC_TO_READING: Record<keyof ThresholdConfig, string> = {
  aqi: "aqi",
  tvocPpb: "tvocPpb",
  eco2Ppm: "eco2Ppm",
  tempC: "tempC",
  rhPct: "rhPct",
  dustUgm3: "dustUgm3",
};

//  useThresholdAlert
export function useThresholdAlert() {
  const latest = useSensorStore(selectLatest);
  const { thresholds, enabled, addAlert, setLastAlertAt, lastAlertAt } =
    useThresholdStore();

  const permissionRequested = useRef(false);

  useEffect(() => {
    if (permissionRequested.current) return;
    permissionRequested.current = true;

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!latest || !enabled) return;

    const now = Date.now();

    (Object.keys(thresholds) as Array<keyof ThresholdConfig>).forEach(
      (metric) => {
        const readingKey = METRIC_TO_READING[metric];
        const value = (latest as Record<string, number>)[readingKey];
        const threshold = thresholds[metric];

        if (typeof value !== "number" || isNaN(value)) return;

        if (value <= threshold) return;

        const lastAt = lastAlertAt[metric] ?? 0;
        if (now - lastAt < ALERT_COOLDOWN_MS) return;

        // ── Trigger alert ────────────────────
        const meta: { label: string; unit: string } = METRIC_META[metric];

        const alert: ActiveAlert = {
          id: `${metric}-${now}`,
          metric,
          label: meta.label,
          value: Math.round(value * 100) / 100,
          threshold,
          unit: meta.unit,
          triggeredAt: new Date(),
        };

        addAlert(alert);

        setLastAlertAt(metric, now);

        sendBrowserNotification(alert);
      },
    );
  }, [latest, enabled, thresholds, addAlert, setLastAlertAt, lastAlertAt]);
}

// ─────────────────────────────────────────
//  Browser notification helper
// ─────────────────────────────────────────
function sendBrowserNotification(alert: ActiveAlert) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(`⚠️ Air Quality Alert — ${alert.label}`, {
    body: `${alert.label} is ${alert.value} ${alert.unit}, exceeds threshold of ${alert.threshold} ${alert.unit}`,
    icon: "/favicon.ico",
    tag: alert.metric,
  });
}
