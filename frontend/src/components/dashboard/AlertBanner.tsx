"use client";

import { useThresholdStore } from "@/src/stores/thresholdStore";

export function AlertBanner() {
  const { activeAlerts, dismissAlert, dismissAll } = useThresholdStore();

  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {/* Header jika lebih dari 1 alert */}
      {activeAlerts.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-red-400 font-medium">
            {activeAlerts.length} active alerts
          </span>
          <button
            onClick={dismissAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Dismiss all
          </button>
        </div>
      )}

      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start justify-between gap-3 px-4 py-3
            bg-red-950/40 border border-red-900/50 rounded-xl
            animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {/* Left: icon + message */}
          <div className="flex items-start gap-3">
            {/* Warning icon */}
            <div className="mt-0.5 shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-red-400"
              >
                <path
                  d="M8 1L15 14H1L8 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6V9M8 11V11.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-medium text-red-300">
                {alert.label} threshold exceeded
              </p>
              <p className="text-xs text-red-400/80 mt-0.5">
                Current:{" "}
                <span className="font-semibold text-red-300">
                  {alert.value} {alert.unit}
                </span>{" "}
                · Limit:{" "}
                <span className="text-red-400">
                  {alert.threshold} {alert.unit}
                </span>{" "}
                · {formatTime(alert.triggeredAt)}
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => dismissAlert(alert.id)}
            className="shrink-0 p-1 rounded-lg text-red-500
              hover:text-red-300 hover:bg-red-900/40 transition-colors"
            aria-label="Dismiss alert"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
