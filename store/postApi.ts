import { RootState } from "@reduxjs/toolkit/query";
import { api } from "./api";

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (type) => `/posts?type=${type}`,
      providesTags: ["Post"],
    }),
    createPost: builder.mutation({
      query: (newPost) => ({
        url: "/posts",
        method: "POST",
        body: newPost,
      }),
      invalidatesTags: ["Post"],
    }),
    // likePost: builder.mutation({
    //   query: (id) => ({
    //     url: `/posts/${id}/like`,
    //     method: "POST",
    //   }),
    //   invalidatesTags: ["Post"],
    // }),

    likePost: builder.mutation({
      query: ({ postId, currentLikes, currentlyLiked }) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
        body: { currentLikes, currentlyLiked },
      }),
      // Optimistic update configuration
      onQueryStarted: async (
        { id, currentLikes, currentlyLiked },
        { dispatch, queryFulfilled, getState },
      ) => {
        const state = getState() as RootState;
        const userId = state.auth.user?.id;
        console.log("userId", userId);

        // Create a patch for optimistic update
        const patchResult = dispatch(
          postApi.util.updateQueryData("getPosts", undefined, (draft) => {
            const post = draft.find((p) => p.id === id);
            if (post) {
              post._count.likes = currentlyLiked
                ? currentLikes - 1
                : currentLikes + 1;
              // Update likes array
              if (currentlyLiked) {
                post.likes = post.likes?.filter((l) => l.userId !== userId);
              } else {
                post.likes = [...(post.likes || []), { userId: userId }];
              }
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert if request fails
          patchResult.undo();
        }
      },
    }),

    repostPost: builder.mutation({
      query: ({ id, content, image }) => ({
        url: `/posts/${id}/repost`,
        method: "POST",
        body: { content, image },
      }),
      invalidatesTags: ["Post"],
    }),
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: ["Post"],
    }),
    getComments: builder.query({
      query: (id) => `/posts/${id}/comments`,
      providesTags: ["Post"],
    }),
    commentPost: builder.mutation({
      query: ({ id, content, parentId }) => ({
        url: `/posts/${id}/comment`,
        method: "POST",
        body: { content, parentId },
      }),
      invalidatesTags: ["Post"],
    }),
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useRepostPostMutation,
  useGetPostQuery,
  useGetCommentsQuery,
  useCommentPostMutation,
  useDeletePostMutation,
} = postApi;
