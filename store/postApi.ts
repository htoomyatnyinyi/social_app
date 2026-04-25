// optimize code 
import { api } from "./api";

// 1. GLOBAL CACHE HELPER
// Recursively finds and updates a post in any RTKQ draft shape
const applyToDraft = (draft: any, targetId: string, callback: (post: any) => void) => {
  const findAndApply = (data: any) => {
    if (!data) return;
    if (Array.isArray(data)) {
      const post = data.find((p: any) => p.id === targetId);
      if (post) callback(post);
    } else if (data.posts && Array.isArray(data.posts)) {
      findAndApply(data.posts);
    } else if (data.id === targetId) {
      callback(data);
    }
  };
  findAndApply(draft);
};

// 2. OPTIMIZED TRANSFORMER
// Removed the recursive `while` loop to prevent UI thread blocking on large feeds
const transformNormalizedResponse = (response: any) => {
  if (response.posts && response.users) {
    const mapUser = (post: any) => {
      if (!post) return post;

      // Map primary author
      if (post.authorId && response.users[post.authorId]) {
        post.author = response.users[post.authorId];
      } else if (post.isDeleted) {
        post.author = {
          id: "deleted",
          name: "Deleted User",
          username: "deleted",
          image: "https://via.placeholder.com/48",
        };
      }

      // Map original post (Depth limited to 1 for performance)
      if (post.originalPost?.authorId && response.users[post.originalPost.authorId]) {
        post.originalPost.author = response.users[post.originalPost.authorId];
      }

      // Map parent post
      if (post.parentPost?.authorId && response.users[post.parentPost.authorId]) {
        post.parentPost.author = response.users[post.parentPost.authorId];
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
    
    // --- QUERIES ---

    getPosts: builder.query({
      query: ({ type, cursor }) => {
        let url = type === "private" ? "/posts/feed" : `/posts?type=${type}`;
        if (cursor) url += type === "private" ? `?cursor=${cursor}` : `&cursor=${cursor}`;
        return url;
      },
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => `getPosts-${queryArgs.type}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result?.posts
          ? [
              ...result.posts.map(({ id }: any) => ({ type: "Post" as const, id })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    getFeed: builder.query({
      query: ({ cursor }) => (cursor ? `/posts/feed?cursor=${cursor}` : "/posts/feed"),
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: () => "getFeed",
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result?.posts
          ? [
              ...result.posts.map(({ id }: any) => ({ type: "Post" as const, id })),
              { type: "Post" as const, id: "FEED" },
            ]
          : [{ type: "Post" as const, id: "FEED" }],
    }),

    getBookmarks: builder.query({
      query: () => "/posts/bookmarks",
      keepUnusedDataFor: 180,
      providesTags: (result) =>
        result
          ? [
              ...(result.posts || result).map(({ id }: any) => ({ type: "Post" as const, id })),
              { type: "Post", id: "BOOKMARKS" },
            ]
          : [{ type: "Post", id: "BOOKMARKS" }],
    }),

    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    getThread: builder.query({
      query: (id) => `/posts/${id}/thread`,
      transformResponse: (res: any) => transformNormalizedResponse(res).posts,
      keepUnusedDataFor: 90,
      providesTags: (result, error, id) =>
        result
          ? [
              ...result.map((p: any) => ({ type: "Post" as const, id: p.id })),
              { type: "Post", id: `THREAD-${id}` },
            ]
          : [{ type: "Post", id: `THREAD-${id}` }],
    }),

    getReplies: builder.query({
      query: ({ id, cursor }) => (cursor ? `/posts/${id}/replies?cursor=${cursor}` : `/posts/${id}/replies`),
      transformResponse: transformNormalizedResponse,
      serializeQueryArgs: ({ queryArgs }) => `getReplies-${queryArgs.id}`,
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) return newItems;
        currentCache.posts.push(...newItems.posts);
        currentCache.nextCursor = newItems.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
      keepUnusedDataFor: 90,
      providesTags: (result, error, { id }) =>
        result?.posts
          ? [
              ...result.posts.map((p: any) => ({ type: "Post" as const, id: p.id })),
              { type: "Post", id: `REPLIES-${id}` },
            ]
          : [{ type: "Post", id: `REPLIES-${id}` }],
    }),

    getPostsByType: builder.query({
      query: (type) => `/posts?type=${type}`,
    }),

    getPostAnalytics: builder.query({
      query: (id) => `/posts/${id}/analytics`,
      providesTags: (result, error, id) => [{ type: "Post", id: `ANALYTICS-${id}` }],
      keepUnusedDataFor: 300,
    }),


    // --- MUTATIONS ---

    createPost: builder.mutation({
      query: (newPost) => ({ url: "/posts", method: "POST", body: newPost }),
      async onQueryStarted({ content, image, images }, { dispatch, queryFulfilled, getState }) {
        const currentUser = (getState() as any).auth?.user;
        if (!currentUser) return;

        const tempId = `temp-${Date.now()}`;
        const newPostOptimistic = {
          id: tempId,
          content,
          image: image || (images && images[0]),
          images: images || [],
          createdAt: new Date().toISOString(),
          author: currentUser,
          authorId: currentUser.id,
          _count: { likes: 0, replies: 0, reposts: 0, quotes: 0 },
          isLiked: false,
          isBookmarked: false,
          repostedByMe: false,
        };

        const patches = [
          dispatch(postApi.util.updateQueryData("getPosts" as any, { type: "public", cursor: null } as any, (draft: any) => {
            if (draft?.posts) draft.posts.unshift(newPostOptimistic);
          })),
          dispatch(postApi.util.updateQueryData("getFeed" as any, { cursor: null } as any, (draft: any) => {
            if (draft?.posts) draft.posts.unshift(newPostOptimistic);
          })),
          dispatch(postApi.util.updateQueryData("getUserPosts" as any, { id: currentUser.id, cursor: null } as any, (draft: any) => {
            if (draft?.posts) draft.posts.unshift(newPostOptimistic);
          })),
        ];

        try { await queryFulfilled; } catch { patches.forEach(p => p.undo()); }
      },
      invalidatesTags: (result, error, arg) => {
        const userId = result?.authorId || result?.author?.id;
        return [
          { type: "Post", id: "LIST" },
          { type: "Post", id: "FEED" },
          ...(userId ? [{ type: "Post" as const, id: `USER-${userId}` }] : []),
        ];
      },
    }),

    likePost: builder.mutation({
      query: ({ postId }) => ({ url: `/posts/${postId}/like`, method: "POST" }),
      async onQueryStarted({ postId, threadId }, { dispatch, queryFulfilled, getState }) {
        const userId = (getState() as any).auth?.user?.id;

        const toggleLike = (post: any) => {
          post.isLiked = !post.isLiked;
          if (post._count) post._count.likes = Math.max(0, (post._count.likes || 0) + (post.isLiked ? 1 : -1));
        };

        const endpointsToPatch = [
          { name: "getPosts", args: { type: "public", cursor: null } },
          { name: "getPosts", args: { type: "private", cursor: null } },
          { name: "getFeed", args: { cursor: null } },
          { name: "getPost", args: postId },
          { name: "getThread", args: postId },
          { name: "getTrending", args: undefined },
        ];

        if (threadId) {
          endpointsToPatch.push({ name: "getThread", args: threadId }, { name: "getReplies", args: { id: threadId } });
        }

        if (userId) {
          endpointsToPatch.push(
            { name: "getUserPosts", args: { id: userId, cursor: null } },
            { name: "getUserLikes", args: { id: userId, cursor: null } },
            { name: "getUserReplies", args: { id: userId, cursor: null } }
          );
        }

        const patches = endpointsToPatch.map(({ name, args }) =>
          dispatch(postApi.util.updateQueryData(name as any, args as any, (draft) => applyToDraft(draft, postId, toggleLike)))
        );

        try { await queryFulfilled; } catch { patches.forEach((p) => p.undo()); }
      },
      invalidatesTags: (result, error, { postId }) => [{ type: "Post", id: postId }],
    }),

    bookmarkPost: builder.mutation({
      query: (arg) => ({
        url: `/posts/${typeof arg === "string" ? arg : arg.id}/bookmark`,
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        const id = typeof arg === "string" ? arg : arg.id;
        const threadId = typeof arg === "string" ? undefined : arg.threadId;
        const userId = (getState() as any).auth?.user?.id;

        const toggleBookmark = (post: any) => { post.isBookmarked = !post.isBookmarked; };

        const endpointsToPatch = [
          { name: "getPosts", args: { type: "public", cursor: null } },
          { name: "getPosts", args: { type: "private", cursor: null } },
          { name: "getFeed", args: { cursor: null } },
          { name: "getPost", args: id },
          { name: "getThread", args: id },
          { name: "getTrending", args: undefined },
        ];

        if (threadId) {
          endpointsToPatch.push({ name: "getThread", args: threadId }, { name: "getReplies", args: { id: threadId } });
        }

        if (userId) {
          endpointsToPatch.push(
            { name: "getUserPosts", args: { id: userId, cursor: null } },
            { name: "getUserLikes", args: { id: userId, cursor: null } },
            { name: "getUserReplies", args: { id: userId, cursor: null } },
            { name: "getBookmarks", args: undefined }
          );
        }

        const patches = endpointsToPatch.map(({ name, args }) =>
          dispatch(postApi.util.updateQueryData(name as any, args as any, (draft) => applyToDraft(draft, id, toggleBookmark)))
        );

        try { await queryFulfilled; } catch { patches.forEach((p) => p.undo()); }
      },
      invalidatesTags: (result, error, arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        return [{ type: "Post", id }, { type: "Post", id: "BOOKMARKS" }];
      },
    }),

    repostPost: builder.mutation({
      query: ({ id, content, image, images }) => ({
        url: `/posts/${id}/repost`,
        method: "POST",
        body: { content, image, images },
      }),
      async onQueryStarted({ id, content, threadId }, { dispatch, queryFulfilled, getState }) {
        if (content) return; // Skip optimistic update for quotes, wait for invalidation

        const toggleRepost = (post: any) => {
          post.repostedByMe = true;
          post.repostsCount = (post.repostsCount || 0) + 1;
          if (post._count) post._count.reposts = post.repostsCount;
        };

        const endpointsToPatch = [
          { name: "getPosts", args: { type: "public", cursor: null } },
          { name: "getFeed", args: { cursor: null } },
          { name: "getPost", args: id },
          { name: "getThread", args: id },
          { name: "getTrending", args: undefined },
        ];

        if (threadId) {
           endpointsToPatch.push({ name: "getThread", args: threadId }, { name: "getReplies", args: { id: threadId } });
        }

        const userId = (getState() as any).auth?.user?.id;
        if (userId) {
          endpointsToPatch.push(
            { name: "getUserPosts", args: { id: userId, cursor: null } },
            { name: "getUserLikes", args: { id: userId, cursor: null } },
            { name: "getUserReplies", args: { id: userId, cursor: null } }
          );
        }

        const patches = endpointsToPatch.map(({ name, args }) =>
          dispatch(postApi.util.updateQueryData(name as any, args as any, (draft) => applyToDraft(draft, id, toggleRepost)))
        );

        try { await queryFulfilled; } catch { patches.forEach((p) => p.undo()); }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Post", id: typeof arg === "string" ? arg : arg.id },
        { type: "Post", id: "LIST" },
        { type: "Post", id: "FEED" },
      ],
    }),

    deleteRepost: builder.mutation({
      query: (arg) => ({
        url: `/posts/${typeof arg === "string" ? arg : arg.id}/repost`,
        method: "DELETE",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        const id = typeof arg === "string" ? arg : arg.id;
        const threadId = typeof arg === "string" ? undefined : arg.threadId;

        const removeRepost = (post: any) => {
          post.repostedByMe = false;
          post.repostsCount = Math.max(0, (post.repostsCount || 0) - 1);
          if (post._count) post._count.reposts = post.repostsCount;
        };

        const endpointsToPatch = [
          { name: "getPosts", args: { type: "public", cursor: null } },
          { name: "getFeed", args: { cursor: null } },
          { name: "getPost", args: id },
          { name: "getThread", args: id },
          { name: "getTrending", args: undefined },
        ];

        if (threadId) {
           endpointsToPatch.push({ name: "getThread", args: threadId }, { name: "getReplies", args: { id: threadId } });
        }

        const userId = (getState() as any).auth?.user?.id;
        if (userId) {
          endpointsToPatch.push(
            { name: "getUserPosts", args: { id: userId, cursor: null } },
            { name: "getUserLikes", args: { id: userId, cursor: null } },
            { name: "getUserReplies", args: { id: userId, cursor: null } }
          );
        }

        const patches = endpointsToPatch.map(({ name, args }) =>
          dispatch(postApi.util.updateQueryData(name as any, args as any, (draft) => applyToDraft(draft, id, removeRepost)))
        );

        try { await queryFulfilled; } catch { patches.forEach((p) => p.undo()); }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Post", id: typeof arg === "string" ? arg : arg.id },
        { type: "Post", id: "LIST" },
        { type: "Post", id: "FEED" },
      ],
    }),

    replyPost: builder.mutation({
      query: ({ postId, content, image, images }) => ({ 
        url: `/posts/${postId}/reply`, 
        method: "POST", 
        body: { content, image, images } 
      }),
      async onQueryStarted({ postId, content, image, images }, { dispatch, queryFulfilled, getState }) {
        const currentUser = (getState() as any).auth?.user;
        const tempId = `temp-${Date.now()}`;

        const replyOptimistic = {
          id: tempId,
          content,
          image: image || (images && images[0]),
          images: images || [],
          createdAt: new Date().toISOString(),
          author: currentUser || { name: "You", username: "me" },
          replyToId: postId,
          _count: { likes: 0, replies: 0, reposts: 0, quotes: 0 },
          isLiked: false,
        };

        const patches = [
          dispatch(
            postApi.util.updateQueryData("getThread", postId, (draft: any) => {
              if (Array.isArray(draft)) {
                draft.push(replyOptimistic);
              }
            })
          ),
          dispatch(
            postApi.util.updateQueryData("getReplies", { id: postId, cursor: null }, (draft: any) => {
              if (draft?.posts) {
                draft.posts.unshift(replyOptimistic);
              }
            })
          )
        ];

        try { await queryFulfilled; } catch { patches.forEach(p => p.undo()); }
      },
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
        { type: "Post", id: `THREAD-${postId}` },
        { type: "Post", id: `REPLIES-${postId}` },
        { type: "Post", id: "FEED" },
        { type: "Post", id: "LIST" },
      ],
    }),

    incrementViewCount: builder.mutation({
      query: ({ postId }) => ({ url: `/posts/${postId}/view`, method: "POST" }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        const incrementView = (post: any) => { post.viewCount = (post.viewCount || 0) + 1; };

        dispatch(postApi.util.updateQueryData("getPosts", { type: "public", cursor: null } as any, (draft) => applyToDraft(draft, postId, incrementView)));
        dispatch(postApi.util.updateQueryData("getPosts", { type: "private", cursor: null } as any, (draft) => applyToDraft(draft, postId, incrementView)));
        dispatch(postApi.util.updateQueryData("getPost", postId, (draft) => applyToDraft(draft, postId, incrementView)));

        try { await queryFulfilled; } catch { console.log("View count increment failed"); }
      },
    }),

    deletePost: builder.mutation({
      query: ({ id }) => ({ url: `/posts/${id}`, method: "DELETE" }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchPublic = dispatch(
          postApi.util.updateQueryData("getPosts", { type: "public", cursor: null } as any, (draft) => {
            if (draft?.posts) draft.posts = draft.posts.filter((p: any) => p.id !== id && p.originalPost?.id !== id);
          })
        );
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: null } as any, (draft) => {
            if (draft?.posts) {
              draft.posts = draft.posts.filter((p: any) => !(p.isRepost && p.originalPost?.id === id) && p.id !== id);
            }
          })
        );

        try { await queryFulfilled; } catch { patchPublic.undo(); patchFeed.undo(); }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
        { type: "Post", id: "FEED" },
        { type: "Post", id: `ANALYTICS-${id}` },
        { type: "User" },
      ],
    }),

    reportPost: builder.mutation({
      query: ({ id, reason }) => ({ url: `/posts/${id}/report`, method: "POST", body: { reason } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }],
    }),

    blockPost: builder.mutation({
      query: ({ id }) => ({ url: `/posts/${id}/block`, method: "POST" }),
      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }],
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
  useDeleteRepostMutation,
  useReportPostMutation,
  useGetPostAnalyticsQuery,
} = postApi;

