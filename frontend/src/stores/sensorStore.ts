import { create } from "zustand";
import type { SensorReading } from "@../../../src/types/sensor.types";

// ─────────────────────────────────────────
//  Konstanta
// ─────────────────────────────────────────

const MAX_HISTORY_SIZE = 60;

// ─────────────────────────────────────────
//  State shape
// ─────────────────────────────────────────
interface SensorState {
  // Data terbaru dari WebSocket
  latest: SensorReading | null;

  // Buffer history untuk chart realtime (max 60 data point)
  history: SensorReading[];

  // Status koneksi WebSocket
  isConnected: boolean;

  // Waktu terakhir data diterima
  lastReceivedAt: Date | null;

  // Device yang terkoneksi
  connectedDevices: string[];
}

// ─────────────────────────────────────────
//  Actions shape
// ─────────────────────────────────────────
interface SensorActions {
  // Dipanggil oleh useSensorSocket saat data baru masuk dari WS
  setLatest: (reading: SensorReading) => void;

  // Dipanggil oleh useSensorSocket saat status koneksi berubah
  setConnected: (connected: boolean) => void;

  // Dipanggil saat fetch /sensors/latest berhasil (initial load)
  setConnectedDevices: (devices: string[]) => void;

  // Reset state — berguna untuk cleanup saat unmount
  reset: () => void;
}

// ─────────────────────────────────────────
//  Initial state
// ─────────────────────────────────────────
const initialState: SensorState = {
  latest: null,
  history: [],
  isConnected: false,
  lastReceivedAt: null,
  connectedDevices: [],
};

// ─────────────────────────────────────────
//  Store
// ─────────────────────────────────────────
export const useSensorStore = create<SensorState & SensorActions>((set) => ({
  ...initialState,

  setLatest: (reading) =>
    set((state) => {
      // Tambahkan ke history, jaga agar tidak melebihi MAX_HISTORY_SIZE
      const newHistory = [...state.history, reading];
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift(); // buang data paling lama (FIFO)
      }

      return {
        latest: reading,
        history: newHistory,
        lastReceivedAt: new Date(),
      };
    }),

  setConnected: (connected) => set({ isConnected: connected }),

  setConnectedDevices: (devices) => set({ connectedDevices: devices }),

  reset: () => set(initialState),
}));

// ─────────────────────────────────────────
//  Selector helpers — hindari re-render tidak perlu
//  Gunakan ini di komponen, bukan akses state langsung
// ─────────────────────────────────────────
export const selectLatest = (s: SensorState & SensorActions) => s.latest;
export const selectHistory = (s: SensorState & SensorActions) => s.history;
export const selectIsConnected = (s: SensorState & SensorActions) =>
  s.isConnected;
export const selectLastReceivedAt = (s: SensorState & SensorActions) =>
  s.lastReceivedAt;
export const selectConnectedDevices = (s: SensorState & SensorActions) =>
  s.connectedDevices;
