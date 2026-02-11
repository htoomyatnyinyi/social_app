import { api } from "./api";

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetUnreadCountQuery,
} = notificationApi;
