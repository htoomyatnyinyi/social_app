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
    changeEmail: builder.mutation({
      query: (data) => ({
        url: "/settings/change-email",
        method: "POST",
        body: data,
      }),
    }),
    changePhone: builder.mutation({
      query: (data) => ({
        url: "/settings/change-phone",
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
    getAccountArchive: builder.query({
      query: () => "/settings/account/archive",
      providesTags: ["Settings"],
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
    getSecurityPreferences: builder.query({
      query: () => "/settings/security-preferences",
      providesTags: ["Settings"],
    }),
    updateSecurityPreferences: builder.mutation({
      query: (data) => ({
        url: "/settings/security-preferences",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Settings"],
    }),
    getActiveSessions: builder.query({
      query: () => "/settings/active-sessions",
      providesTags: ["Settings"],
    }),
    revokeSession: builder.mutation({
      query: (id) => ({
        url: `/settings/active-sessions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangePhoneMutation,
  useDeleteAccountMutation,
  useLazyGetAccountArchiveQuery,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetSecurityPreferencesQuery,
  useUpdateSecurityPreferencesMutation,
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
} = settingsApi;
