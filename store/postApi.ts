import { api } from "./api";

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (type) => `/posts?type=${type}`,
      providesTags: ["Post"],
    }),
    // getPosts: builder.query({
    //   query: (type = "public") => `/posts?type=${type}`,
    //   providesTags: ["Post"],
    // }),

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
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
      }),
      // Optimistic update configuration
      async onQueryStarted(postId, { dispatch, queryFulfilled, getState }) {
        const userId = getState().auth.user?.id;

        // Create a patch for optimistic update
        const patchResult = dispatch(
          postApi.util.updateQueryData("getPosts", undefined, (draft) => {
            const post = draft.find((p) => p.id === postId);
            if (post) {
              const alreadyLiked = post.likes?.some((l) => l.userId === userId);

              if (alreadyLiked) {
                // Unlike
                post.likes = post.likes?.filter((l) => l.userId !== userId);
                post._count.likes -= 1;
              } else {
                // Like
                post.likes = [...(post.likes || []), { userId }];
                post._count.likes = (post._count.likes || 0) + 1;
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
