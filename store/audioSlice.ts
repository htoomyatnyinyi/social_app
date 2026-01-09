import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AudioState {
  enableDhammaAudio: boolean;
  volume: number; // 0.0 to 1.0
}

const initialState: AudioState = {
  enableDhammaAudio: false,
  volume: 0.8,
};

const audioSlice = createSlice({
  name: "audio",
  initialState,
  reducers: {
    toggleDhammaAudio: (state) => {
      state.enableDhammaAudio = !state.enableDhammaAudio;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
  },
});

export const { toggleDhammaAudio, setVolume } = audioSlice.actions;
export default audioSlice.reducer;
