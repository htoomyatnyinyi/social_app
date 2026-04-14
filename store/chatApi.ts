import { api } from "./api";

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChatRooms: builder.query({
      query: () => "/chat/rooms",
      keepUnusedDataFor: 60,
      refetchOnReconnect: true,
      providesTags: ["Chat"],
    }),
    getPublicChat: builder.query({
      query: () => "/chat/public",
      keepUnusedDataFor: 300,
      refetchOnReconnect: true,
      providesTags: ["Chat"],
    }),

    createChatRoom: builder.mutation({
      query: (targetUserId) => ({
        url: "/chat/rooms",
        method: "POST",
        body: { targetUserId },
      }),
      invalidatesTags: ["Chat"],
    }),
    getMessages: builder.query({
      query: ({ chatId, cursor }) => {
        let url = `/chat/messages/${chatId}`;
        const params: string[] = [];
        if (cursor) params.push(`cursor=${cursor}`);
        if (params.length > 0) url += `?${params.join("&")}`;
        return url;
      },
      serializeQueryArgs: ({ queryArgs }) => `getMessages-${queryArgs.chatId}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        // Prepend older messages (since they come in ascending order)
        const existingIds = new Set(currentCache.messages.map((m: any) => m.id));
        const uniqueNew = newItems.messages.filter((m: any) => !existingIds.has(m.id));
        currentCache.messages = [...uniqueNew, ...currentCache.messages];
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      keepUnusedDataFor: 45,
      refetchOnReconnect: true,
      providesTags: ["Message"],
    }),
    markMessagesAsRead: builder.mutation({
      query: (chatId) => ({
        url: `/chat/rooms/${chatId}/read`,
        method: "POST",
      }),
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          chatApi.util.updateQueryData("getChatRooms", {}, (draft: any) => {
            if (!draft) return;
            const room = draft.find((r: any) => r.id === chatId);
            if (room) {
              room.unreadCount = 0;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Chat", "Notification"],
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useCreateChatRoomMutation,
  useGetPublicChatQuery,
  useGetMessagesQuery,
  useMarkMessagesAsReadMutation,
} = chatApi;
