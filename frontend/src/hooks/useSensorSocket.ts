import { useEffect, useRef } from "react";
import { getSocket } from "@../../../src//lib/socket";
import {
  useSensorStore,
  selectIsConnected,
} from "@../../../src/stores/sensorStore";
import {
  WS_EVENTS,
  type SensorReading,
} from "@../../../src/types/sensor.types";

// ─────────────────────────────────────────
//  useSensorSocket
// ─────────────────────────────────────────
export function useSensorSocket() {
  const setLatest = useSensorStore((s) => s.setLatest);
  const setConnected = useSensorStore((s) => s.setConnected);
  const isConnected = useSensorStore(selectIsConnected);

  const listenersAttached = useRef(false);

  useEffect(() => {
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    const socket = getSocket();

    // ── Event handlers ───────────────────
    const onConnect = () => {
      setConnected(true);
      // Minta data terbaru saat pertama connect
      socket.emit(WS_EVENTS.GET_LATEST);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onSensorData = (data: SensorReading) => {
      setLatest(data);
    };

    const onSensorLatest = (data: SensorReading) => {
      // Sama seperti sensor:data tapi untuk initial load
      setLatest(data);
    };

    const onError = (err: { message: string }) => {
      console.warn("[WebSocket] Error:", err.message);
    };

    // ── Pasang listeners ─────────────────
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(WS_EVENTS.SENSOR_DATA, onSensorData);
    socket.on(WS_EVENTS.SENSOR_LATEST, onSensorLatest);
    socket.on(WS_EVENTS.ERROR, onError);

    // Handle jika socket sudah connect sebelum listener dipasang
    if (socket.connected) {
      setConnected(true);
      socket.emit(WS_EVENTS.GET_LATEST);
    }

    // ── Cleanup saat unmount ─────────────
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(WS_EVENTS.SENSOR_DATA, onSensorData);
      socket.off(WS_EVENTS.SENSOR_LATEST, onSensorLatest);
      socket.off(WS_EVENTS.ERROR, onError);
      listenersAttached.current = false;
    };
  }, [setLatest, setConnected]);

  return { isConnected };
}
