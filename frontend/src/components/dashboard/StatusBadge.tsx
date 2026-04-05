"use client";

import { AQI_CONFIG } from "@/src/types/sensor.types";

interface StatusBadgeProps {
  aqi: number | null;
  className?: string;
}

export function StatusBadge({ aqi, className = "" }: StatusBadgeProps) {
  if (aqi === null) {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          bg-gray-800 text-gray-400 ${className}`}
      >
        No data
      </span>
    );
  }

  const clamped = Math.min(Math.max(Math.round(aqi), 1), 5) as
    | 1
    | 2
    | 3
    | 4
    | 5;
  const config = AQI_CONFIG[clamped];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {/* Status dot */}
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
