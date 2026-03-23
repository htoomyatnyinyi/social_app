import { api } from "./api";

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: (id) => `/profile/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/profile/update",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: "User", id: result?.id },
        "Post", // Broad invalidate for name/image changes across posts
      ],
    }),
    followUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/follow`,
        method: "POST",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const currentUserId = (getState() as any).auth.user?.id;
        if (!currentUserId) return;

        // 1. Update the targeted user's profile
        const patchTarget = dispatch(
          profileApi.util.updateQueryData("getProfile", id, (draft: any) => {
            if (draft) {
              const isFollowing = draft.followers?.some((f: any) => f.followerId === currentUserId);
              if (isFollowing) {
                draft._count.followers = Math.max(0, (draft._count.followers || 0) - 1);
                draft.followers = draft.followers.filter((f: any) => f.followerId !== currentUserId);
              } else {
                draft._count.followers = (draft._count.followers || 0) + 1;
                draft.followers = [...(draft.followers || []), { followerId: currentUserId }];
              }
            }
          })
        );

        // 2. Update current user's following count
        const patchMe = dispatch(
          profileApi.util.updateQueryData("getProfile", currentUserId, (draft: any) => {
            if (draft) {
              const isFollowing = (getState() as any).auth.user?.following?.some((f: any) => f.followingId === id); 
              // Note: Ideally we'd have the isFollowing state correctly here. 
              // For now we'll just increment/decrement based on a guess or wait for the target patch logic to be stable.
              // A better way is to check the cache of the target user first.
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchTarget.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "Profile" }, // For suggestions
      ],
    }),
    muteUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/mute`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "User", id }],
    }),
    blockUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        "Post", // To hide their posts
      ],
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
      providesTags: (result, error, id) => [{ type: "User", id: `FOLLOWERS_${id}` }],
    }),
    getFollowing: builder.query({
      query: (id) => `/profile/${id}/following`,
      providesTags: (result, error, id) => [{ type: "User", id: `FOLLOWING_${id}` }],
    }),
    getUserPosts: builder.query({
      query: (id) => `/profile/${id}/posts`,
      providesTags: (result, error, id) => [{ type: "Post", id: `USER_POSTS_${id}` }],
    }),
    getUserLikes: builder.query({
      query: (id) => `/profile/${id}/likes`,
      providesTags: (result, error, id) => [{ type: "Post", id: `USER_LIKES_${id}` }],
    }),
    getSuggestions: builder.query({
      query: () => "/profile/suggestions",
      providesTags: ["Profile"],
    }),
    getUserReplies: builder.query({
      query: (id) => `/profile/${id}/replies`,
      providesTags: (result, error, id) => [{ type: "Post", id: `USER_REPLIES_${id}` }],
    }),
    getUserReposts: builder.query({
      query: (id) => `/profile/${id}/reposts`,
      providesTags: (result, error, id) => [{ type: "Post", id: `USER_REPOSTS_${id}` }],
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
