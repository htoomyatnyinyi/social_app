import { api } from "./api";

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (type = "public") => `/posts?type=${type}`,
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
    likePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Post"],
    }),
    repostPost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/repost`,
        method: "POST",
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
