import { api } from "./api";

export const searchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
      providesTags: ["User", "Post"],
    }),
  }),
});

export const { useGlobalSearchQuery } = searchApi;
