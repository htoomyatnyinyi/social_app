import { api } from "./api";

// Reconstitute author objects from normalized `users` map
const transformNormalizedResponse = (response: any) => {
  if (response.posts && response.users) {
    const mapUser = (post: any) => {
      if (!post) return post;
      // Map author to post
      if (post.authorId && response.users[post.authorId]) {
        post.author = response.users[post.authorId];
      }
      // Map author to quoted/original post
      if (post.originalPost) {
        if (
          post.originalPost.authorId &&
          response.users[post.originalPost.authorId]
        ) {
          post.originalPost.author = response.users[post.originalPost.authorId];
        }
      }
      // Map author for parent post
      if (post.parentPost) {
        if (
          post.parentPost.authorId &&
          response.users[post.parentPost.authorId]
        ) {
          post.parentPost.author = response.users[post.parentPost.authorId];
        }
      }
      return post;
    };
    response.posts = response.posts.map(mapUser);
  }
  return response;
};

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: (id) => `/profile/${id}`,
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/profile/update",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User", "Post"],
    }),
    followUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/follow`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Post"],
    }),
    muteUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/mute`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Post"],
    }),
    blockUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Post"],
    }),
    updatePushToken: builder.mutation({
      query: (data) => ({
        url: "/profile/push-token",
        method: "POST",
        body: data,
      }),
    }),
    getFollowers: builder.query({
      query: ({ id, cursor }) => {
        let url = `/profile/${id}/followers`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      serializeQueryArgs: ({ queryArgs }) => `getFollowers-${queryArgs.id}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.users.push(...newItems.users);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["User"],
    }),
    getFollowing: builder.query({
      query: ({ id, cursor }) => {
        let url = `/profile/${id}/following`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      serializeQueryArgs: ({ queryArgs }) => `getFollowing-${queryArgs.id}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.users.push(...newItems.users);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["User"],
    }),
    getUserPosts: builder.query({
      query: ({ id, cursor }) => {
        let url = `/profile/${id}/posts`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => `getUserPosts-${queryArgs.id}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["Post"],
    }),
    getUserLikes: builder.query({
      query: ({ id, cursor }) => {
        let url = `/profile/${id}/likes`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => `getUserLikes-${queryArgs.id}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["Post"],
    }),
    getSuggestions: builder.query({
      query: () => "/profile/suggestions",
      providesTags: ["Profile"],
    }),
    getUserReplies: builder.query({
      query: ({ id, cursor }) => {
        let url = `/profile/${id}/replies`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => `getUserReplies-${queryArgs.id}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["Post"],
    }),
    getUserReposts: builder.query({
      query: (id) => `/profile/${id}/reposts`,
      providesTags: ["Post"],
    }),
    getBlockedUsers: builder.query({
      query: () => "/profile/blocked",
      providesTags: ["User"],
    }),
    getMutedUsers: builder.query({
      query: () => "/profile/muted",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useFollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetUserPostsQuery,
  useGetUserLikesQuery,
  useGetSuggestionsQuery,
  useGetUserRepliesQuery,
  useGetUserRepostsQuery,
  useMuteUserMutation,
  useBlockUserMutation,
  useUpdatePushTokenMutation,
  useGetBlockedUsersQuery,
  useGetMutedUsersQuery,
} = profileApi;
