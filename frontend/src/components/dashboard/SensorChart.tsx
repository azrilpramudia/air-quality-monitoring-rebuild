"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SensorReading } from "@/src/types/sensor.types";

type ChartMetric =
  | "tvocPpb"
  | "eco2Ppm"
  | "tempC"
  | "rhPct"
  | "dustUgm3"
  | "aqi";

interface MetricConfig {
  key: ChartMetric;
  label: string;
  color: string;
  unit: string;
}

const METRICS: MetricConfig[] = [
  { key: "aqi", label: "AQI", color: "#f97316", unit: "" },
  { key: "tvocPpb", label: "TVOC", color: "#facc15", unit: "ppb" },
  { key: "eco2Ppm", label: "eCO₂", color: "#a78bfa", unit: "ppm" },
  { key: "tempC", label: "Temperature", color: "#f87171", unit: "°C" },
  { key: "rhPct", label: "Humidity", color: "#34d399", unit: "%" },
  { key: "dustUgm3", label: "Dust", color: "#fb7185", unit: "µg/m³" },
];

interface SensorChartProps {
  data: SensorReading[];
  activeMetrics?: ChartMetric[];
  title?: string;
  height?: number;
  isLoading?: boolean;
}

// Format timestamp untuk label X axis
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Custom tooltip agar tampil rapi
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    unit?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2">
        {label ? new Date(label).toLocaleString("id-ID") : ""}
      </p>
      {payload.map((entry) => {
        const metric = METRICS.find((m) => m.label === entry.name);
        return (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="font-medium text-white">
              {entry.value.toFixed(1)} {metric?.unit ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SensorChart({
  data,
  activeMetrics = ["aqi", "tvocPpb", "eco2Ppm"],
  title = "Sensor Data",
  height = 300,
  isLoading = false,
}: SensorChartProps) {
  const activeConfigs = METRICS.filter((m) => activeMetrics.includes(m.key));

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/60
          border border-gray-800/50 rounded-2xl"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-orange-500 border-t-transparent
            rounded-full animate-spin"
          />
          <span className="text-sm text-gray-500">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900/60
          border border-gray-800/50 rounded-2xl"
        style={{ height }}
      >
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-5">
      {title && (
        <h3 className="text-sm font-medium text-gray-400 mb-4">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#374151", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#9ca3af",
              paddingTop: "12px",
            }}
          />
          {activeConfigs.map((metric) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              name={metric.label}
              stroke={metric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Re-export MetricConfig dan METRICS untuk dipakai di halaman
export { METRICS };
export type { ChartMetric, MetricConfig };
