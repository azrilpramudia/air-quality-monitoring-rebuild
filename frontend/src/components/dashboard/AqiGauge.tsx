"use client";

import { AQI_CONFIG } from "@/src/types/sensor.types";
import { StatusBadge } from "./StatusBadge";

interface AqiGaugeProps {
  aqi: number | null;
  deviceId?: string;
}

export function AqiGauge({ aqi, deviceId }: AqiGaugeProps) {
  const clamped =
    aqi !== null
      ? (Math.min(Math.max(Math.round(aqi), 1), 5) as 1 | 2 | 3 | 4 | 5)
      : null;

  const config = clamped ? AQI_CONFIG[clamped] : null;

  const RADIUS = 70;
  const STROKE = 10;
  const CENTER = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ARC_RATIO = 0.75;
  const ARC_LENGTH = CIRCUMFERENCE * ARC_RATIO;

  // Progress berdasarkan AQI 1–5
  const progress = clamped ? (clamped - 1) / 4 : 0;
  const dashOffset = ARC_LENGTH - progress * ARC_LENGTH;

  return (
    <div
      className="flex flex-col items-center gap-4 p-6
      bg-gray-900/60 border border-gray-800/50 rounded-2xl"
    >
      {/* SVG Arc Gauge */}
      <div className="relative">
        <svg
          width={CENTER * 2}
          height={CENTER * 2}
          viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
          className="-rotate-135"
        >
          {/* Track (background arc) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#1f2937"
            strokeWidth={STROKE}
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
          />

          {/* Active arc */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={config?.color ?? "#374151"}
            strokeWidth={STROKE}
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease",
            }}
          />
        </svg>

        {/* Center content — rotasi balik agar tidak ikut -135deg */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ color: config?.color ?? "#6b7280" }}
          >
            {aqi ?? "—"}
          </span>
          <span className="text-xs text-gray-500 mt-1 tracking-widest uppercase">
            AQI
          </span>
        </div>
      </div>

      {/* Status badge */}
      <StatusBadge aqi={aqi} />

      {/* AQI Scale indicator */}
      <div className="flex gap-1.5 items-center">
        {([1, 2, 3, 4, 5] as const).map((level) => (
          <div
            key={level}
            className="w-6 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: AQI_CONFIG[level].color,
              opacity: clamped && clamped >= level ? 1 : 0.2,
            }}
          />
        ))}
      </div>

      {deviceId && <p className="text-xs text-gray-600">{deviceId}</p>}
    </div>
  );
}
