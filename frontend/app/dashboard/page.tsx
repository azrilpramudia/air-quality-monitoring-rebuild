"use client";

import { useState } from "react";
import {
  useSensorStore,
  selectLatest,
  selectHistory,
} from "@/src/stores/sensorStore";
import { useSensorStats, useSensorLatest } from "@/src/hooks/useSensorStats";
import { useSensorHistoryLast24h } from "@/src/hooks/useSensorHistory";
import { AqiGauge } from "@/src/components/dashboard/AqiGauge";
import { SensorCard } from "@/src/components/dashboard/SensorCard";
import { SensorChart } from "@/src/components/dashboard/SensorChart";
import { ConnectionStatus } from "@/src/components/dashboard/ConnectionStatus";
import { AlertBanner } from "@/src/components/dashboard/AlertBanner";
import { ThresholdSettings } from "@/src/components/dashboard/ThresholdSettings";
import type { ChartMetric } from "@/src/components/dashboard/SensorChart";

//  Sensor card config
const CARD_CONFIGS = [
  {
    key: "tempC" as const,
    title: "Temperature",
    unit: "°C",
    color: "text-red-400",
    bgColor: "bg-red-950/30",
    borderColor: "border-red-900/40",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    ),
  },
  {
    key: "rhPct" as const,
    title: "Humidity",
    unit: "%",
    color: "text-cyan-400",
    bgColor: "bg-cyan-950/30",
    borderColor: "border-cyan-900/40",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    key: "tvocPpb" as const,
    title: "TVOC",
    unit: "ppb",
    color: "text-yellow-400",
    bgColor: "bg-yellow-950/30",
    borderColor: "border-yellow-900/40",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
      </svg>
    ),
  },
  {
    key: "eco2Ppm" as const,
    title: "eCO₂",
    unit: "ppm",
    color: "text-violet-400",
    bgColor: "bg-violet-950/30",
    borderColor: "border-violet-900/40",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
  {
    key: "dustUgm3" as const,
    title: "Dust",
    unit: "µg/m³",
    color: "text-pink-400",
    bgColor: "bg-pink-950/30",
    borderColor: "border-pink-900/40",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="8" cy="8" r="2" />
        <circle cx="16" cy="8" r="1.5" />
        <circle cx="12" cy="14" r="2.5" />
        <circle cx="6" cy="15" r="1" />
        <circle cx="18" cy="14" r="1.5" />
      </svg>
    ),
  },
] as const;

//  Helper — format nilai sensor
function formatValue(
  value: number | null | undefined,
  key: (typeof CARD_CONFIGS)[number]["key"],
): string | null {
  if (value === null || value === undefined) return null;
  if (key === "tempC") return value.toFixed(1);
  if (key === "rhPct") return value.toFixed(0);
  if (key === "dustUgm3") return value.toFixed(1);
  return Math.round(value).toString();
}

//  Dashboard Page
export default function DashboardPage() {
  const latest = useSensorStore(selectLatest);
  const history = useSensorStore(selectHistory);

  useSensorLatest();
  const { data: stats, isLoading: statsLoading } = useSensorStats();

  const { data: historyData, isLoading: historyLoading } =
    useSensorHistoryLast24h();

  const [activeMetrics, setActiveMetrics] = useState<ChartMetric[]>([
    "aqi",
    "tvocPpb",
    "eco2Ppm",
  ]);

  const toggleMetric = (metric: ChartMetric) => {
    setActiveMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  const chartData = history.length >= 2 ? history : (historyData?.data ?? []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Header ───────────────────────── */}
      <header className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 py-4
          flex items-center justify-between"
        >
          <div>
            <h1 className="text-lg font-semibold text-white">
              Air Quality Monitor
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThresholdSettings />
            <ConnectionStatus />
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <AlertBanner />
        {/* ── Row 1: AQI Gauge + Sensor Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* AQI Gauge */}
          <AqiGauge aqi={latest?.aqi ?? null} deviceId={latest?.deviceId} />

          {/* Sensor metric cards — 2x3 grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CARD_CONFIGS.map((config) => {
              const rawValue = latest?.[config.key] ?? null;
              const value = formatValue(rawValue as number | null, config.key);

              const avgKey = config.key as keyof NonNullable<
                typeof stats
              >["averages"];
              const avg = stats?.averages?.[avgKey];
              const subtitle =
                avg !== null && avg !== undefined
                  ? `Avg: ${formatValue(avg, config.key)} ${config.unit}`
                  : undefined;

              return (
                <SensorCard
                  key={config.key}
                  title={config.title}
                  value={value}
                  unit={config.unit}
                  icon={config.icon}
                  color={config.color}
                  bgColor={config.bgColor}
                  borderColor={config.borderColor}
                  subtitle={subtitle}
                />
              );
            })}
          </div>
        </div>

        {/* ── Row 2: Realtime Chart ─────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400">
              {history.length >= 2
                ? "Realtime (last 5 min)"
                : "Historical data (24h)"}
            </h2>

            {/* Metric toggle pills */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "aqi",
                  "tvocPpb",
                  "eco2Ppm",
                  "tempC",
                  "rhPct",
                  "dustUgm3",
                ] as ChartMetric[]
              ).map((metric) => {
                const isActive = activeMetrics.includes(metric);
                const label: Record<ChartMetric, string> = {
                  aqi: "AQI",
                  tvocPpb: "TVOC",
                  eco2Ppm: "eCO₂",
                  tempC: "Temp",
                  rhPct: "Hum",
                  dustUgm3: "Dust",
                };
                return (
                  <button
                    key={metric}
                    onClick={() => toggleMetric(metric)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium
                      transition-all duration-200 border
                      ${
                        isActive
                          ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-500 hover:text-gray-300"
                      }`}
                  >
                    {label[metric]}
                  </button>
                );
              })}
            </div>
          </div>

          <SensorChart
            data={chartData}
            activeMetrics={activeMetrics}
            height={300}
            isLoading={history.length === 0 && historyLoading}
          />
        </section>

        {/* ── Row 3: Stats Summary ──────────── */}
        {!statsLoading && stats && (
          <section>
            <h2 className="text-sm font-medium text-gray-400 mb-3">
              Summary statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Total readings",
                  value: stats.totalReadings.toLocaleString(),
                  color: "text-blue-400",
                },
                {
                  label: "Current AQI",
                  value: stats.currentAqi ?? "—",
                  color: "text-orange-400",
                },
                {
                  label: "Peak AQI",
                  value: stats.peaks.maxAqi ?? "—",
                  color: "text-red-400",
                },
                {
                  label: "Peak TVOC",
                  value: stats.peaks.maxTvoc
                    ? `${stats.peaks.maxTvoc} ppb`
                    : "—",
                  color: "text-yellow-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-900/60 border border-gray-800/50
                    rounded-xl p-4"
                >
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Row 4: Historical Chart ───────── */}
        {historyData && historyData.data.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-400 mb-3">
              Historical data (last 24h)
            </h2>
            <SensorChart
              data={historyData.data}
              activeMetrics={activeMetrics}
              height={250}
              isLoading={historyLoading}
            />
            <p className="text-xs text-gray-600 mt-2 text-right">
              {historyData.total} records · saved every 1 minute
            </p>
          </section>
        )}
      </main>

      {/* ── Footer ───────────────────────── */}
      <footer className="border-t border-gray-800/50 mt-10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-gray-700 text-center">
            Air Quality Monitor
          </p>
        </div>
      </footer>
    </div>
  );
}
