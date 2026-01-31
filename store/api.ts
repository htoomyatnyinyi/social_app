import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = "http://localhost:8080"; // Replace with your IP for physical devices

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      // In a real app, you'd get the token from the state or storage
      // const token = (getState() as RootState).auth.token;
      // if (token) {
      //   headers.set("authorization", `Bearer ${token}`);
      // }
      return headers;
    },
  }),
  tagTypes: ["Post", "User", "Chat", "Message"],
  endpoints: () => ({}),
});
