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
      query: (id) => `/profile/${id}/followers`,
      providesTags: ["User"],
    }),
    getFollowing: builder.query({
      query: (id) => `/profile/${id}/following`,
      providesTags: ["User"],
    }),
    getUserPosts: builder.query({
      query: (id) => `/profile/${id}/posts`,
      transformResponse: transformNormalizedResponse,
      providesTags: ["Post"],
    }),
    getUserLikes: builder.query({
      query: (id) => `/profile/${id}/likes`,
      transformResponse: transformNormalizedResponse,
      providesTags: ["Post"],
    }),
    getSuggestions: builder.query({
      query: () => "/profile/suggestions",
      providesTags: ["Profile"],
    }),
    getUserReplies: builder.query({
      query: (id) => `/profile/${id}/replies`,
      transformResponse: transformNormalizedResponse,
      providesTags: ["Post"],
    }),
    getUserReposts: builder.query({
      query: (id) => `/profile/${id}/reposts`,
      providesTags: ["Post"],
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
} = profileApi;
