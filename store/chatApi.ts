import { api } from "./api";

// Unified helper for clean cache patching
const applyToDraft = (
  draft: any,
  targetId: string,
  callback: (item: any) => void,
) => {
  if (!draft) return;
  if (Array.isArray(draft)) {
    const item = draft.find((i: any) => i.id === targetId);
    if (item) callback(item);
  } else if (draft.id === targetId) {
    callback(draft);
  }
};

export const chatApi = api.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getChatRooms: builder.query({
      query: () => "/chat/rooms",
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }: any) => ({ type: "Chat" as const, id })),
              { type: "Chat", id: "LIST" },
            ]
          : [{ type: "Chat", id: "LIST" }],
    }),

    getMessages: builder.query({
      query: ({ chatId, cursor }) => {
        let url = `/chat/messages/${chatId}`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      serializeQueryArgs: ({ queryArgs }) => `getMessages-${queryArgs.chatId}`,
      merge: (currentCache, newItems, { arg }) => {
        // If no cursor, it's a fresh load (e.g., opening the room)
        if (!arg.cursor) return newItems;

        // When scrolling UP for history, prepend unique messages
        const existingIds = new Set(
          currentCache.messages.map((m: any) => m.id),
        );
        const uniqueNew = newItems.messages.filter(
          (m: any) => !existingIds.has(m.id),
        );

        currentCache.messages = [...uniqueNew, ...currentCache.messages];
        currentCache.nextCursor = newItems.nextCursor;
      },
      // Refetch only when the cursor changes (pagination)
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
      keepUnusedDataFor: 60,
      providesTags: (result, error, { chatId }) => [
        { type: "Message", id: chatId },
      ],

      /**
       * UPGRADE: Real-time WebSocket Integration
       * This is where you connect your existing socket logic to the RTK Cache
       */
      async onCacheEntryAdded(
        { chatId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        try {
          await cacheDataLoaded;
          // Example: socket.on("new_message", (msg) => {
          //   if (msg.chatId === chatId) {
          //     updateCachedData((draft) => {
          //       draft.messages.push(msg);
          //     });
          //   }
          // });
        } catch {}
        await cacheEntryRemoved;
      },
    }),

    markMessagesAsRead: builder.mutation({
      query: (chatId) => ({
        url: `/chat/rooms/${chatId}/read`,
        method: "POST",
      }),
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        // Optimistically clear unread count in the room list
        const patchResult = dispatch(
          chatApi.util.updateQueryData("getChatRooms", undefined, (draft) => {
            applyToDraft(draft, chatId, (room) => {
              room.unreadCount = 0;
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, chatId) => [
        { type: "Chat", id: chatId },
        "Notification",
      ],
    }),

    // // Added for completeness: Send message mutation with optimistic update
    // sendMessage: builder.mutation({
    //   query: ({ chatId, content }) => ({
    //     url: `/chat/messages/${chatId}`,
    //     method: "POST",
    //     body: { content },
    //   }),
    //   async onQueryStarted(
    //     { chatId, content },
    //     { dispatch, queryFulfilled, getState },
    //   ) {
    //     const currentUser = (getState() as any).auth?.user;
    //     const tempId = `temp-${Date.now()}`;

    //     const patch = dispatch(
    //       chatApi.util.updateQueryData(
    //         "getMessages",
    //         { chatId } as any,
    //         (draft) => {
    //           draft.messages.push({
    //             id: tempId,
    //             content,
    //             senderId: currentUser?.id,
    //             createdAt: new Date().toISOString(),
    //             sending: true, // Useful for showing a loading spinner on the message bubble
    //           });
    //         },
    //       ),
    //     );

    //     try {
    //       await queryFulfilled;
    //     } catch {
    //       patch.undo();
    //     }
    //   },
    // }),

    sendMessage: builder.mutation({
      query: ({
        chatId,
        content,
        mediaUrl,
        type,
        metadata,
        replyToId,
        replyToName,
        replyToContent,
      }) => ({
        url: `/chat/messages/${chatId}`,
        method: "POST",
        body: {
          content,
          mediaUrl,
          type: type || "text",
          metadata,
          replyToId,
          replyToName,
          replyToContent,
        },
      }),
      async onQueryStarted(
        {
          chatId,
          content,
          mediaUrl,
          type,
          metadata,
          replyToId,
          replyToName,
          replyToContent,
        },
        { dispatch, queryFulfilled, getState },
      ) {
        const currentUser = (getState() as any).auth?.user;
        const tempId = `temp-${Date.now()}`;

        const patch = dispatch(
          chatApi.util.updateQueryData("getMessages", { chatId }, (draft) => {
            draft.messages.push({
              id: tempId,
              content: content || "",
              mediaUrl: mediaUrl || null,
              type: type || "text",
              senderId: currentUser?.id,
              senderName: currentUser?.name,
              createdAt: new Date().toISOString(),
              status: "pending",
              sending: true,
              replyToId: replyToId || null,
              replyToName: replyToName || null,
              replyToContent: replyToContent || null,
              metadata: metadata ? JSON.stringify(metadata) : null,
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getPublicChat: builder.query({
      query: () => "/chat/public",
      keepUnusedDataFor: 300,
      providesTags: ["Chat"],
    }),

    createChatRoom: builder.mutation({
      query: (targetUserId) => ({
        url: "/chat/rooms",
        method: "POST",
        body: { targetUserId },
      }),
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useCreateChatRoomMutation,
  useGetPublicChatQuery,
  useGetMessagesQuery,
  useMarkMessagesAsReadMutation,
  useSendMessageMutation,
} = chatApi;

// original code not optimize yet.
// import { api } from "./api";

// export const chatApi = api.injectEndpoints({
//   endpoints: (builder) => ({
//     getChatRooms: builder.query({
//       query: () => "/chat/rooms",
//       keepUnusedDataFor: 60,
//       refetchOnReconnect: true,
//       providesTags: ["Chat"],
//     }),
//     getPublicChat: builder.query({
//       query: () => "/chat/public",
//       keepUnusedDataFor: 300,
//       refetchOnReconnect: true,
//       providesTags: ["Chat"],
//     }),

//     createChatRoom: builder.mutation({
//       query: (targetUserId) => ({
//         url: "/chat/rooms",
//         method: "POST",
//         body: { targetUserId },
//       }),
//       invalidatesTags: ["Chat"],
//     }),
//     getMessages: builder.query({
//       query: ({ chatId, cursor }) => {
//         let url = `/chat/messages/${chatId}`;
//         const params: string[] = [];
//         if (cursor) params.push(`cursor=${cursor}`);
//         if (params.length > 0) url += `?${params.join("&")}`;
//         return url;
//       },
//       serializeQueryArgs: ({ queryArgs }) => `getMessages-${queryArgs.chatId}`,
//       merge: (currentCache, newItems, { arg }) => {
//         if (!arg.cursor) return newItems;
//         // Prepend older messages (since they come in ascending order)
//         const existingIds = new Set(currentCache.messages.map((m: any) => m.id));
//         const uniqueNew = newItems.messages.filter((m: any) => !existingIds.has(m.id));
//         currentCache.messages = [...uniqueNew, ...currentCache.messages];
//         currentCache.nextCursor = newItems.nextCursor;
//       },
//       forceRefetch({ currentArg, previousArg }) {
//         return currentArg?.cursor !== previousArg?.cursor;
//       },
//       keepUnusedDataFor: 45,
//       refetchOnReconnect: true,
//       providesTags: ["Message"],
//     }),
//     markMessagesAsRead: builder.mutation({
//       query: (chatId) => ({
//         url: `/chat/rooms/${chatId}/read`,
//         method: "POST",
//       }),
//       async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
//         const patchResult = dispatch(
//           chatApi.util.updateQueryData("getChatRooms", {}, (draft: any) => {
//             if (!draft) return;
//             const room = draft.find((r: any) => r.id === chatId);
//             if (room) {
//               room.unreadCount = 0;
//             }
//           })
//         );
//         try {
//           await queryFulfilled;
//         } catch {
//           patchResult.undo();
//         }
//       },
//       invalidatesTags: ["Chat", "Notification"],
//     }),
//   }),
// });

// export const {
//   useGetChatRoomsQuery,
//   useCreateChatRoomMutation,
//   useGetPublicChatQuery,
//   useGetMessagesQuery,
//   useMarkMessagesAsReadMutation,
// } = chatApi;
