// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// export const API_URL = "http://localhost:8080"; // Replace with your IP for physical devices
// // export const API_URL = "http://192.168.1.245:8080"; // Replace with your IP for physical devices
// // export const API_URL = "http://192.168.1.144:8080"; // Replace with your IP for physical devices

// export const api = createApi({
//   reducerPath: "api",
//   baseQuery: fetchBaseQuery({
//     baseUrl: API_URL,
//     prepareHeaders: (headers, { getState }) => {
//       // Get the token from the store
//       const token = (getState() as any).auth.token;
//       if (token) {
//         headers.set("authorization", `Bearer ${token}`);
//       }
//       return headers;
//     },
//   }),
//   tagTypes: [
//     "Post",
//     "User",
//     "Comment",
//     "Chat",
//     "Message",
//     "Notification",
//     "Profile",
//   ],
//   endpoints: () => ({}),
// });

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// export const API_URL = "http://192.168.1.144:8080"; // Replace with your IP for physical devices
// export const API_URL = "http://localhost:8080"; // Replace with your IP for physical devices
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:8080" ||
  "http://192.168.1.144:8080";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      // Pull token from the auth slice
      const token = (getState() as any).auth.token;
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
  ],
  endpoints: () => ({}),
});
