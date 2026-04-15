import { api } from "./api";

export const meditationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMeditationStats: builder.query<any, void>({
      query: () => "/meditation/stats",
      providesTags: ["Profile"],
    }),
    recordSession: builder.mutation<any, { duration: number }>({
      query: (body) => ({
        url: "/meditation/session",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),
    updateMeditationStatus: builder.mutation<any, { isMeditating: boolean }>({
      query: (body) => ({
        url: "/meditation/status",
        method: "POST", // Changed to POST as per your previous snippet
        body,
      }),
      // ADDED THIS:
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMeditationStatsQuery,
  useRecordSessionMutation,
  useUpdateMeditationStatusMutation,
} = meditationApi;
// import { api } from "./api";

// export const meditationApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getMeditationStats: builder.query<any, void>({
//       query: () => "/meditation/stats",
//       providesTags: ["Profile"],
//     }),
//     recordSession: builder.mutation<any, { duration: number }>({
//       query: (body) => ({
//         url: "/meditation/session",
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: ["Profile"],
//     }),
//     updateMeditationStatus: builder.mutation<any, { isMeditating: boolean }>({
//       query: (body) => ({
//         url: "/meditation/status",
//         method: "POST",
//         body,
//       }),
//     }),
//   }),
// });

// export const {
//   useGetMeditationStatsQuery,
//   useRecordSessionMutation,
//   useUpdateMeditationStatusMutation,
// } = meditationApi;
