import { api } from "./api";

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChatRooms: builder.query({
      query: () => "/chat/rooms",
      providesTags: ["Chat"],
    }),
    getPublicChat: builder.query({
      query: () => "/chat/public",
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
      query: (chatId) => `/chat/messages/${chatId}`,
      providesTags: ["Message"],
    }),
    markMessagesAsRead: builder.mutation({
      query: (chatId) => ({
        url: `/chat/rooms/${chatId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Chat"],
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
