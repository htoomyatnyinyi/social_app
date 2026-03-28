import { api } from "./api";

// Reconstitute author objects from normalized `users` map
const transformNormalizedResponse = (response: any) => {
  if (response.posts && response.users) {
    const mapUser = (post: any) => {
      if (!post) return post;
      // Map author to post
      if (post.authorId && response.users[post.authorId]) {
        post.author = response.users[post.authorId];
      } else if (post.isDeleted) {
        post.author = { id: 'deleted', name: 'Deleted User', username: 'deleted', image: 'https://via.placeholder.com/48' };
      }
      // Map author to quoted/original post
      if (post.originalPost) {
        if (post.originalPost.authorId && response.users[post.originalPost.authorId]) {
          post.originalPost.author = response.users[post.originalPost.authorId];
        }
      }
      // Map author to parent post (for Replies tab)
      if (post.parentPost) {
        if (
          post.parentPost.authorId &&
          response.users[post.parentPost.authorId]
        ) {
          post.parentPost.author = response.users[post.parentPost.authorId];
        }
      }
      // Map preview replies
      if (post.previewReplies && Array.isArray(post.previewReplies)) {
        post.previewReplies = post.previewReplies.map(mapUser);
      }
      return post;
    };
    response.posts = response.posts.map(mapUser);
  }
  return response;
};

export const postApi = api.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: ({ type, cursor }) => {
        if (type === "private") {
          let url = "/posts/feed";
          if (cursor) url += `?cursor=${cursor}`;
          return url;
        }
        let url = `/posts?type=${type}`;
        if (cursor) url += `&cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => {
        return `getPosts-${queryArgs.type}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) {
          return newItems;
        }
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["Post"],
    }),

    getFeed: builder.query({
      query: ({ cursor }) => {
        let url = "/posts/feed";
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: () => "getFeed",
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) {
          return newItems;
        }
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.cursor !== previousArg?.cursor;
      },
      providesTags: ["Post"],
    }),

    getBookmarks: builder.query({
      query: () => "/posts/bookmarks",
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
      query: ({ postId }) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        // Optimistic: toggle isLiked + _count.likes on all cached lists
        const updateList = (endpointName: string, args: any) =>
          dispatch(
            postApi.util.updateQueryData(endpointName as any, args, (draft: any) => {
              if (!draft?.posts) return;
              const post = draft.posts.find((p: any) => p.id === postId);
              if (post) {
                if (post.isLiked) {
                  post.isLiked = false;
                  if (post._count) post._count.likes = Math.max(0, (post._count.likes || 0) - 1);
                } else {
                  post.isLiked = true;
                  if (post._count) post._count.likes = (post._count.likes || 0) + 1;
                }
              }
            }),
          );

        const patchPublic = updateList("getPosts", { type: "public" } as any);
        const patchPrivate = updateList("getPosts", { type: "private" } as any);
        const patchFeed = updateList("getFeed", { cursor: null } as any);

        // Also update the single post detail view
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft: any) => {
            if (draft) {
              if (draft.isLiked) {
                draft.isLiked = false;
                if (draft._count) draft._count.likes = Math.max(0, (draft._count.likes || 0) - 1);
              } else {
                draft.isLiked = true;
                if (draft._count) draft._count.likes = (draft._count.likes || 0) + 1;
              }
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchPrivate.undo();
          patchFeed.undo();
          patchPost.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),

    bookmarkPost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/bookmark`,
        method: "POST",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const updateList = (endpointName: string, args: any) =>
          dispatch(
            postApi.util.updateQueryData(endpointName as any, args, (draft: any) => {
              if (!draft?.posts) return;
              const post = draft.posts.find((p: any) => p.id === id);
              if (post) {
                post.isBookmarked = !post.isBookmarked;
              }
            }),
          );

        const patchPublic = updateList("getPosts", { type: "public" } as any);
        const patchPrivate = updateList("getPosts", { type: "private" } as any);
        const patchFeed = updateList("getFeed", { cursor: null } as any);
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", id, (draft: any) => {
            if (draft) draft.isBookmarked = !draft.isBookmarked;
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchPrivate.undo();
          patchFeed.undo();
          patchPost.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),

    repostPost: builder.mutation({
      query: ({ id, content, image, images }) => ({
        url: `/posts/${id}/repost`,
        method: "POST",
        body: { content, image, images },
      }),
      async onQueryStarted(
        { id, content },
        { dispatch, queryFulfilled },
      ) {
        if (content) return; // Don't optimistically update quotes

        const updateList = (endpointName: string, args: any) =>
          dispatch(
            postApi.util.updateQueryData(endpointName as any, args, (draft: any) => {
              if (!draft?.posts) return;
              const post = draft.posts.find((p: any) => p.id === id);
              if (post) {
                post.repostedByMe = true;
                post.repostsCount = (post.repostsCount || 0) + 1;
              }
            }),
          );

        const patchPosts = updateList("getPosts", { type: "public", cursor: null } as any);
        const patchFeed = updateList("getFeed", { cursor: null } as any);

        try {
          await queryFulfilled;
        } catch {
          patchPosts.undo();
          patchFeed.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),

    deleteRepost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/repost`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const updateList = (endpointName: string, args: any) =>
          dispatch(
            postApi.util.updateQueryData(endpointName as any, args, (draft: any) => {
              if (!draft?.posts) return;
              const post = draft.posts.find((p: any) => p.id === id);
              if (post) {
                post.repostedByMe = false;
                post.repostsCount = Math.max(0, (post.repostsCount || 0) - 1);
              }
            }),
          );

        const patchPosts = updateList("getPosts", { type: "public", cursor: null } as any);
        const patchFeed = updateList("getFeed", { cursor: null } as any);

        try {
          await queryFulfilled;
        } catch {
          patchPosts.undo();
          patchFeed.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),

    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: ["Post"],
    }),

    getThread: builder.query({
      query: (id) => `/posts/${id}/thread`,
      transformResponse: (res: any) => transformNormalizedResponse(res).posts,
      providesTags: ["Post"],
    }),

    getReplies: builder.query({
      query: ({ id, cursor }) => {
        let url = `/posts/${id}/replies`;
        if (cursor) url += `?cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => `getReplies-${queryArgs.id}`,
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

    replyPost: builder.mutation({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/reply`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Post"],
    }),

    incrementViewCount: builder.mutation({
      query: ({ postId }) => ({
        url: `/posts/${postId}/view`,
        method: "POST",
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        const updateList = (endpointName: string, args: any) =>
          dispatch(
            postApi.util.updateQueryData(endpointName as any, args, (draft: any) => {
              if (!draft?.posts) return;
              const post = draft.posts.find((p: any) => p.id === postId);
              if (post) post.viewCount = (post.viewCount || 0) + 1;
            }),
          );

        updateList("getPosts", { type: "public" } as any);
        updateList("getPosts", { type: "private" } as any);
        dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft: any) => {
            if (draft) draft.viewCount = (draft.viewCount || 0) + 1;
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          console.log("View count increment failed");
        }
      },
    }),

    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchPublic = dispatch(
          postApi.util.updateQueryData("getPosts", { type: "public", cursor: null } as any, (draft) => {
            if (draft?.posts) {
              draft.posts = draft.posts.filter((p: any) => p.id !== id && p.originalPost?.id !== id);
            }
          }),
        );
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: null } as any, (draft) => {
            if (draft?.posts) {
              draft.posts = draft.posts.filter((p: any) => {
                if (p.isRepost && p.originalPost?.id === id) return false;
                if (p.id === id) return false;
                return true;
              });
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchFeed.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),

    getPostsByType: builder.query({
      query: (type) => `/posts?type=${type}`,
    }),

    reportPost: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/posts/${id}/report`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Post"],
    }),

    blockPost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: ["Post"],
    }),

    blockUser: builder.mutation({
      query: ({ id }) => ({
        url: `/profile/${id}/block`,
        method: "POST",
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
  useGetThreadQuery,
  useGetRepliesQuery,
  useReplyPostMutation,
  useDeletePostMutation,
  useIncrementViewCountMutation,
  useBookmarkPostMutation,
  useBlockPostMutation,
  useGetBookmarksQuery,
  useBlockUserMutation,
  useDeleteRepostMutation,
  useReportPostMutation,
} = postApi;
