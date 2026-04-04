import { api } from "./api";

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/settings/change-password",
        method: "POST",
        body: data,
      }),
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: "/settings/account",
        method: "DELETE",
      }),
    }),
    getNotificationPreferences: builder.query({
      query: () => "/settings/notification-preferences",
      providesTags: ["Settings"],
    }),
    updateNotificationPreferences: builder.mutation({
      query: (data) => ({
        url: "/settings/notification-preferences",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = settingsApi;
