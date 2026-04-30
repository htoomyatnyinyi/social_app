import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { metrics } from "../lib/metrics";

const DEFAULT_DEV_API_URL = "https://server.myanmarsocial.ccwu.cc";
// export const API_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_DEV_API_URL;


const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state.auth?.token;

    if (token) {
      console.log("📤 API: Attaching token to request (len:", token.length, ")");
      headers.set("authorization", `Bearer ${token}`);
    } else {
      console.log("⚠️ API: No token found in auth state");
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args, apiCtx, extraOptions) => {
    const endpoint =
      typeof args === "string" ? args : `${args.method || "GET"} ${args.url}`;
    const stopTimer = metrics.startTimer("api_request_latency_ms", {
      endpoint,
    });

    const result = await rawBaseQuery(args, apiCtx, extraOptions);
    const elapsedMs = stopTimer();

    if ("error" in result) {
      metrics.increment("api_request_error_total", { endpoint });
      if (__DEV__) {
        console.warn(`[api] failed ${endpoint} in ${elapsedMs}ms`);
      }
    }

    return result;
  },
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
