import { configureStore } from "@reduxjs/toolkit";
import timerReducer from "./timerSlice";
import audioReducer from "./audioSlice";

export const store = configureStore({
  reducer: {
    timer: timerReducer,
    audio: audioReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
