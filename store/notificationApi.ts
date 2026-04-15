import { api } from "./api";

// Reconstitute issuer and post objects from normalized map
const transformNotifications = (response: any) => {
  if (response.notifications && response.users) {
    const mapDetails = (notification: any) => {
      // Map Issuer (User)
      if (notification.issuerId && response.users[notification.issuerId]) {
        notification.issuer = response.users[notification.issuerId];
      }
      
      // Map Post (if notification is related to one)
      if (notification.postId && response.posts && response.posts[notification.postId]) {
        notification.post = response.posts[notification.postId];
      }
      
      return notification;
    };
    response.notifications = response.notifications.map(mapDetails);
  }
  return response;
};

export const notificationApi = api.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({
        url: "/notifications",
        params, // Should include cursor and limit
      }),

      transformResponse: transformNotifications,
      // Handle infinite scrolling cache merge
      serializeQueryArgs: () => "getNotifications",
      merge: (currentCache, newItems, { arg }) => {
        if (!arg?.cursor) {
          return newItems;
        }
        currentCache.notifications.push(...newItems.notifications);
        currentCache.nextCursor = newItems.nextCursor;
      },
      // Refetch only when cursor changes or manual refresh
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      keepUnusedDataFor: 60,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      providesTags: (result) =>
        result?.notifications
          ? [
              ...result.notifications.map(({ id }: any) => ({
                type: "Notification" as const,
                id,
              })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      // Optimistic Update: Mark as read immediately in the UI
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApi.util.updateQueryData(
            "getNotifications",
            {} as any, // Adjust based on your query args
            (draft) => {
              const notification = draft.notifications?.find((n: any) => n.id === id);
              if (notification) {
                notification.read = true;
              }
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: "Notification", id }],
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
      // Optimistic Update: Mark everything read
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationApi.util.updateQueryData("getNotifications", {} as any, (draft) => {
            draft.notifications?.forEach((n: any) => (n.read = true));
          })
        );
        const patchCount = dispatch(
          notificationApi.util.updateQueryData("getUnreadCount", undefined, (draft) => {
            if (draft) draft.count = 0;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
          patchCount.undo();
        }
      },
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),

    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      keepUnusedDataFor: 20,
      refetchOnReconnect: true,
      refetchOnFocus: true,
      providesTags: (result) =>
        result?.count
          ? [
              { type: "Notification", id: "UNREAD-COUNT" },
            ]
          : [{ type: "Notification", id: "UNREAD-COUNT" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useGetUnreadCountQuery,
} = notificationApi;
// import { api } from "./api";

// export const notificationApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getNotifications: builder.query({
//       query: (params) => ({
//         url: "/notifications",
//         params,
//       }),
//       keepUnusedDataFor: 30,
//       // refetchOnReconnect: true,
//       providesTags: ["Notification"],
//     }),
//     markAsRead: builder.mutation({
//       query: (id) => ({
//         url: `/notifications/${id}/read`,
//         method: "POST",
//       }),
//       invalidatesTags: ["Notification"],
//     }),
//     markAllAsRead: builder.mutation({
//       query: () => ({
//         url: "/notifications/read-all",
//         method: "POST",
//       }),
//       invalidatesTags: ["Notification"],
//     }),
//     getUnreadCount: builder.query({
//       query: () => "/notifications/unread-count",
//       keepUnusedDataFor: 20,
//       // refetchOnReconnect: true,
//       providesTags: ["Notification"],
//     }),
//   }),
// });

// export const {
//   useGetNotificationsQuery,
//   useMarkAsReadMutation,
//   useMarkAllAsReadMutation,
//   useGetUnreadCountQuery,
// } = notificationApi;
