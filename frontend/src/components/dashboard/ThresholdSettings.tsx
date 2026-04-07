"use client";

import { useState } from "react";
import {
  useThresholdStore,
  DEFAULT_THRESHOLDS,
} from "@/src/stores/thresholdStore";
import { ThresholdConfig } from "@/src/types/threshold.types";

// Konfigurasi tampilan per metric
const THRESHOLD_META: Array<{
  key: keyof ThresholdConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  {
    key: "aqi",
    label: "AQI",
    unit: "",
    min: 1,
    max: 5,
    step: 1,
    hint: "ENS160 scale 1–5. Level 3 = moderate.",
  },
  {
    key: "tvocPpb",
    label: "TVOC",
    unit: "ppb",
    min: 100,
    max: 5000,
    step: 50,
    hint: "WHO guideline ~1000 ppb for indoor air.",
  },
  {
    key: "eco2Ppm",
    label: "eCO₂",
    unit: "ppm",
    min: 400,
    max: 5000,
    step: 50,
    hint: ">1200 ppm indicates poor ventilation.",
  },
  {
    key: "tempC",
    label: "Temperature",
    unit: "°C",
    min: 20,
    max: 50,
    step: 0.5,
    hint: "Alert when temperature feels dangerous.",
  },
  {
    key: "rhPct",
    label: "Humidity",
    unit: "%",
    min: 30,
    max: 100,
    step: 1,
    hint: ">85% increases mold and bacteria risk.",
  },
  {
    key: "dustUgm3",
    label: "Dust",
    unit: "µg/m³",
    min: 5,
    max: 200,
    step: 5,
    hint: "WHO PM2.5 24h limit: 15 µg/m³.",
  },
];

export function ThresholdSettings() {
  const { thresholds, enabled, setThreshold, setEnabled, resetThresholds } =
    useThresholdStore();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
          font-medium text-gray-400 border border-gray-700/50
          hover:border-gray-600 hover:text-gray-200
          bg-gray-900/50 transition-all duration-200"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7 4V7.5L9 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Threshold settings
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div
          className="mt-3 bg-gray-900/80 border border-gray-700/50
          rounded-2xl p-5 space-y-5"
        >
          {/* Global enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-200">
                Alert notifications
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Trigger browser notification when sensor exceeds threshold
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                enabled ? "bg-orange-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white
                  transition-transform duration-200 ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </div>

          <div className="border-t border-gray-800" />

          {/* Per-metric sliders */}
          <div className="space-y-5">
            {THRESHOLD_META.map((meta) => (
              <div key={meta.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-gray-200">
                      {meta.label}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {meta.hint}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-orange-400 tabular-nums">
                    {thresholds[meta.key]} {meta.unit}
                  </span>
                </div>

                <input
                  type="range"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={thresholds[meta.key]}
                  onChange={(e) =>
                    setThreshold(meta.key, parseFloat(e.target.value))
                  }
                  className="w-full accent-orange-500"
                  disabled={!enabled}
                />

                {/* Min/max labels */}
                <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                  <span>
                    {meta.min} {meta.unit}
                  </span>
                  <span>
                    Default: {DEFAULT_THRESHOLDS[meta.key]} {meta.unit}
                  </span>
                  <span>
                    {meta.max} {meta.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Reset button */}
          <div className="flex justify-end pt-2 border-t border-gray-800">
            <button
              onClick={resetThresholds}
              className="text-xs text-gray-500 hover:text-gray-300
                transition-colors px-3 py-1.5 rounded-lg
                hover:bg-gray-800 border border-transparent
                hover:border-gray-700"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
