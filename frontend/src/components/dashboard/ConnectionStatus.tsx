"use client";

import {
  useSensorStore,
  selectIsConnected,
  selectLastReceivedAt,
} from "@/src/stores/sensorStore";

export function ConnectionStatus() {
  const isConnected = useSensorStore(selectIsConnected);
  const lastReceivedAt = useSensorStore(selectLastReceivedAt);

  return (
    <div className="flex items-center gap-3">
      {/* Connection dot */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            isConnected ? "text-green-400" : "text-red-400"
          }`}
        >
          {isConnected ? "Live" : "Disconnected"}
        </span>
      </div>

      {/* Last received time */}
      {lastReceivedAt && (
        <span className="text-xs text-gray-600">
          Last update: {lastReceivedAt.toLocaleTimeString("id-ID")}
        </span>
      )}
    </div>
  );
}
