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
      query: ({ postId }) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled, getState }) {
        const userId = (getState() as any).auth.user?.id;

        // We need to update both public and private lists if they exist in cache
        const updateCache = (type: string) => {
          return dispatch(
            postApi.util.updateQueryData("getPosts", type, (draft) => {
              const post = draft.find((p: any) => p.id === postId);
              if (post) {
                const hasLiked = post.likes?.some(
                  (l: any) => l.userId === userId,
                );
                if (hasLiked) {
                  post._count.likes -= 1;
                  post.likes = post.likes.filter(
                    (l: any) => l.userId !== userId,
                  );
                } else {
                  post._count.likes += 1;
                  post.likes = [...(post.likes || []), { userId }];
                }
              }
            }),
          );
        };

        const patchPublic = updateCache("public");
        const patchPrivate = updateCache("private");
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft: any) => {
            if (draft) {
              const hasLiked = draft.likes?.some(
                (l: any) => l.userId === userId,
              );
              if (hasLiked) {
                draft._count.likes -= 1;
                draft.likes = draft.likes.filter(
                  (l: any) => l.userId !== userId,
                );
              } else {
                draft._count.likes += 1;
                draft.likes = [...(draft.likes || []), { userId }];
              }
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchPrivate.undo();
          patchPost.undo();
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
