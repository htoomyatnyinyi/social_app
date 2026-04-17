import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SettingsState {
  theme: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  speakerDefault: boolean;
  autoMute: boolean;
}

const initialState: SettingsState = {
  theme: "system",
  accentColor: "#0EA5E9", // Sky-500
  fontSize: "medium",
  speakerDefault: true,
  autoMute: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },
    setFontSize: (state, action: PayloadAction<"small" | "medium" | "large">) => {
      state.fontSize = action.payload;
    },
    setSpeakerDefault: (state, action: PayloadAction<boolean>) => {
      state.speakerDefault = action.payload;
    },
    setAutoMute: (state, action: PayloadAction<boolean>) => {
      state.autoMute = action.payload;
    },
  },
});

export const { setTheme, setAccentColor, setFontSize, setSpeakerDefault, setAutoMute } = settingsSlice.actions;
export default settingsSlice.reducer;
