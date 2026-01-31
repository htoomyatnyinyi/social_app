import { api } from "./api";

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChatRooms: builder.query({
      query: (userId) => `/chat/rooms?userId=${userId}`,
      providesTags: ["Chat"],
    }),
    getPublicChat: builder.query({
      query: () => "/chat/public",
      providesTags: ["Chat"],
    }),
    createChatRoom: builder.mutation({
      query: (userIds) => ({
        url: "/chat/rooms",
        method: "POST",
        body: { userIds },
      }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const { useGetChatRoomsQuery, useCreateChatRoomMutation } = chatApi;
