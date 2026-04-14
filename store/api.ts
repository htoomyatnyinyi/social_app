import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// --- CONFIGURATION ---
// Toggle these by commenting/uncommenting the one you need:
// 1. For Physical Device (Replace with your computer's local IP)
// const DEV_URL = "http://192.168.1.144:8080";

// 2. For iOS Simulator / Android Emulator
// const DEV_URL = "http://localhost:8080";
const DEV_URL = "http://192.168.1.13:8080";

// 3. For Production
// const DEV_URL = "https://server.myanmarsocial.ccwu.cc";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_URL;
// ---------------------

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      // Pull token from the auth slice
      // Note: 'as any' is a quick fix; ideally, use your RootState type here
      const state = getState() as any;
      const token = state.auth?.token;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Post",
    "User",
    "Comment",
    "Chat",
    "Message",
    "Notification",
    "Profile",
    "Settings",
  ],
  endpoints: () => ({}),
});
