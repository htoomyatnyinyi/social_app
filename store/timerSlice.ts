import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type IntervalType = 30 | 60; // Minutes

interface TimerState {
  currentTime: number; // in seconds
  duration: number; // in seconds (e.g., set by user or open-ended)
  interval: IntervalType;
  isRunning: boolean;
  isFinished: boolean;
}

const initialState: TimerState = {
  currentTime: 0,
  duration: 0, // 0 means open ended or not set yet, but for now let's assume we count UP from 0 or DOWN from duration.
  // Simpler: Count UP from 0. Bell rings at interval % currentTime == 0.
  // Or Count DOWN? User said "every half or 1 hour ring". Usually implies a long session.
  // Let's implement Counting UP for flexibility, ringing every X minutes.
  interval: 1,
  isRunning: false,
  isFinished: false,
};

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    startTimer: (state) => {
      state.isRunning = true;
      state.isFinished = false;
    },
    stopTimer: (state) => {
      state.isRunning = false;
    },
    resetTimer: (state) => {
      state.isRunning = false;
      state.currentTime = 0;
      state.isFinished = false;
    },
    tick: (state) => {
      if (state.isRunning) {
        state.currentTime += 1;
      }
    },
    setIntervalTime: (state, action: PayloadAction<IntervalType>) => {
      state.interval = action.payload;
    },
    finishSession: (state) => {
      state.isRunning = false;
      state.isFinished = true;
    },
  },
});

export const {
  startTimer,
  stopTimer,
  resetTimer,
  tick,
  setIntervalTime,
  finishSession,
} = timerSlice.actions;
export default timerSlice.reducer;
