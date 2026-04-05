import { create } from "zustand";
import type { SensorReading } from "@/src/types/sensor.types";

const MAX_HISTORY_SIZE = 60;

interface SensorState {
  latest: SensorReading | null;

  history: SensorReading[];

  isConnected: boolean;

  lastReceivedAt: Date | null;

  connectedDevices: string[];
}

//  Actions shape
interface SensorActions {
  setLatest: (reading: SensorReading) => void;

  setConnected: (connected: boolean) => void;

  setConnectedDevices: (devices: string[]) => void;

  reset: () => void;
}

//  Initial state
const initialState: SensorState = {
  latest: null,
  history: [],
  isConnected: false,
  lastReceivedAt: null,
  connectedDevices: [],
};

//  Store
export const useSensorStore = create<SensorState & SensorActions>((set) => ({
  ...initialState,

  setLatest: (reading) =>
    set((state) => {
      const newHistory = [...state.history, reading];
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
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

export const selectLatest = (s: SensorState & SensorActions) => s.latest;
export const selectHistory = (s: SensorState & SensorActions) => s.history;
export const selectIsConnected = (s: SensorState & SensorActions) =>
  s.isConnected;
export const selectLastReceivedAt = (s: SensorState & SensorActions) =>
  s.lastReceivedAt;
export const selectConnectedDevices = (s: SensorState & SensorActions) =>
  s.connectedDevices;
