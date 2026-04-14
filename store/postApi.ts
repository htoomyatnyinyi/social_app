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
        post.author = {
          id: "deleted",
          name: "Deleted User",
          username: "deleted",
          image: "https://via.placeholder.com/48",
        };
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
      keepUnusedDataFor: 120,
      refetchOnReconnect: true,
      providesTags: (result) =>
        result?.posts
          ? [
              ...result.posts.map(({ id }: any) => ({
                type: "Post" as const,
                id,
              })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
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
      keepUnusedDataFor: 120,
      refetchOnReconnect: true,
      providesTags: (result) =>
        result?.posts
          ? [
              ...result.posts.map(({ id }: any) => ({
                type: "Post" as const,
                id,
              })),
              { type: "Post" as const, id: "FEED" },
            ]
          : [{ type: "Post" as const, id: "FEED" }],
    }),

    getBookmarks: builder.query({
      query: () => "/posts/bookmarks",
      keepUnusedDataFor: 180,
      refetchOnReconnect: true,
      providesTags: (result) =>
        result
          ? [
              ...(result.posts || result).map(({ id }: any) => ({
                type: "Post" as const,
                id,
              })),
              { type: "Post", id: "BOOKMARKS" },
            ]
          : [{ type: "Post", id: "BOOKMARKS" }],
    }),

    createPost: builder.mutation({
      query: (newPost) => ({
        url: "/posts",
        method: "POST",
        body: newPost,
      }),
      invalidatesTags: [
        { type: "Post", id: "LIST" },
        { type: "Post", id: "FEED" },
      ],
    }),

    likePost: builder.mutation({
      query: ({ postId }) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
      }),
      async onQueryStarted(
        { postId, threadId }: { postId: string; threadId?: string },
        { dispatch, queryFulfilled, getState },
      ) {
        const updatePostInDraft = (draft: any, targetId: string) => {
          let post;
          if (Array.isArray(draft)) {
            post = draft.find((p: any) => p.id === targetId);
          } else if (draft?.posts) {
            post = draft.posts.find((p: any) => p.id === targetId);
          } else if (draft?.id === targetId) {
            post = draft;
          }

          if (post) {
            if (post.isLiked) {
              post.isLiked = false;
              if (post._count)
                post._count.likes = Math.max(0, (post._count.likes || 0) - 1);
            } else {
              post.isLiked = true;
              if (post._count) post._count.likes = (post._count.likes || 0) + 1;
            }
          }
        };

        const userId = (getState() as any).auth?.user?.id;

        const patches = [
          dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type: "public", cursor: null } as any,
              (draft) => updatePostInDraft(draft, postId),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type: "private", cursor: null } as any,
              (draft) => updatePostInDraft(draft, postId),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData(
              "getFeed",
              { cursor: null } as any,
              (draft) => updatePostInDraft(draft, postId),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getPost", postId, (draft) =>
              updatePostInDraft(draft, postId),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getThread", postId, (draft) =>
              updatePostInDraft(draft, postId),
            ),
          ),
          ...(threadId
            ? [
                dispatch(
                  postApi.util.updateQueryData("getThread", threadId, (draft) =>
                    updatePostInDraft(draft, postId),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getReplies",
                    { id: threadId } as any,
                    (draft) => updatePostInDraft(draft, postId),
                  ),
                ),
              ]
            : []),
        ];
        if (userId) {
          patches.push(
            dispatch(
              postApi.util.updateQueryData(
                "getUserPosts" as any,
                { id: userId, cursor: null } as any,
                (draft) => updatePostInDraft(draft, postId),
              ),
            ),
            dispatch(
              postApi.util.updateQueryData(
                "getUserLikes" as any,
                { id: userId, cursor: null } as any,
                (draft) => updatePostInDraft(draft, postId),
              ),
            ),
            dispatch(
              postApi.util.updateQueryData(
                "getUserReplies" as any,
                { id: userId, cursor: null } as any,
                (draft) => updatePostInDraft(draft, postId),
              ),
            ),
          );
        }

        // Patch Trending (Explore)
        patches.push(
          dispatch(
            postApi.util.updateQueryData("getTrending" as any, undefined, (draft) =>
              updatePostInDraft(draft, postId),
            ),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId },
      ],
    }),

    bookmarkPost: builder.mutation({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        return {
          url: `/posts/${id}/bookmark`,
          method: "POST",
        };
      },
      async onQueryStarted(
        arg: string | { id: string; threadId?: string },
        { dispatch, queryFulfilled, getState },
      ) {
        const id = typeof arg === "string" ? arg : arg.id;
        const threadId = typeof arg === "string" ? undefined : arg.threadId;

        const updateBookmarkInDraft = (draft: any, targetId: string) => {
          let post;
          if (Array.isArray(draft)) {
            post = draft.find((p: any) => p.id === targetId);
          } else if (draft?.posts) {
            post = draft.posts.find((p: any) => p.id === targetId);
          } else if (draft?.id === targetId) {
            post = draft;
          }
          if (post) post.isBookmarked = !post.isBookmarked;
        };

        const userId = (getState() as any).auth?.user?.id;

        const patches = [
          dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type: "public", cursor: null } as any,
              (draft) => updateBookmarkInDraft(draft, id),
            ),
          ),

          dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type: "private", cursor: null } as any,
              (draft) => updateBookmarkInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData(
              "getFeed",
              { cursor: null } as any,
              (draft) => updateBookmarkInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getPost", id, (draft) =>
              updateBookmarkInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getThread", id, (draft) =>
              updateBookmarkInDraft(draft, id),
            ),
          ),
          ...(threadId
            ? [
                dispatch(
                  postApi.util.updateQueryData("getThread", threadId, (draft) =>
                    updateBookmarkInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getReplies",
                    { id: threadId } as any,
                    (draft) => updateBookmarkInDraft(draft, id),
                  ),
                ),
              ]
            : []),
          ...(userId
            ? [
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserPosts" as any,
                    { id: userId, cursor: null } as any,
                    (draft) => updateBookmarkInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserLikes" as any,
                    { id: userId, cursor: null } as any,
                    (draft) => updateBookmarkInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserReplies" as any,
                    { id: userId, cursor: null } as any,
                    (draft) => updateBookmarkInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getBookmarks" as any,
                    undefined as any,
                    (draft) => updateBookmarkInDraft(draft, id),
                  ),
                ),
              ]
            : []),
        ];

        // Patch Trending (Explore)
        patches.push(
          dispatch(
            postApi.util.updateQueryData("getTrending" as any, undefined, (draft) =>
              updateBookmarkInDraft(draft, id),
            ),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        return [{ type: "Post", id }];
      },
    }),

    repostPost: builder.mutation({
      query: ({ id, content, image, images }) => ({
        url: `/posts/${id}/repost`,
        method: "POST",
        body: { content, image, images },
      }),
      async onQueryStarted(
        {
          id,
          content,
          threadId,
        }: {
          id: string;
          content?: string;
          threadId?: string;
          image?: any;
          images?: any;
        },
        { dispatch, queryFulfilled, getState },
      ) {
        if (content) return; // Don't optimistically update quotes

        const updateRepostInDraft = (
          draft: any,
          targetId: string,
          isDelete = false,
        ) => {
          let post;
          if (Array.isArray(draft)) {
            post = draft.find((p: any) => p.id === targetId);
          } else if (draft?.posts) {
            post = draft.posts.find((p: any) => p.id === targetId);
          } else if (draft?.id === targetId) {
            post = draft;
          }

          if (post) {
            post.repostedByMe = !isDelete;
            post.repostsCount = Math.max(
              0,
              (post.repostsCount || 0) + (isDelete ? -1 : 1),
            );
            // Sync _count if exists
            if (post._count) post._count.reposts = post.repostsCount;
          }
        };

        const patches = [
          dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type: "public", cursor: null } as any,
              (draft) => updateRepostInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData(
              "getFeed",
              { cursor: null } as any,
              (draft) => updateRepostInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getPost", id, (draft) =>
              updateRepostInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getThread", id, (draft) =>
              updateRepostInDraft(draft, id),
            ),
          ),
          ...(threadId
            ? [
                dispatch(
                  postApi.util.updateQueryData("getThread", threadId, (draft) =>
                    updateRepostInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getReplies",
                    { id: threadId } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
              ]
            : []),
          // Profile awareness
          ...((getState() as any).auth?.user?.id
            ? [
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserPosts" as any,
                    {
                      id: (getState() as any).auth.user.id,
                      cursor: null,
                    } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserLikes" as any,
                    {
                      id: (getState() as any).auth.user.id,
                      cursor: null,
                    } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserReplies" as any,
                    {
                      id: (getState() as any).auth.user.id,
                      cursor: null,
                    } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
              ]
            : []),
        ];

        // Patch Trending (Explore)
        patches.push(
          dispatch(
            postApi.util.updateQueryData("getTrending" as any, undefined, (draft) =>
              updateRepostInDraft(draft, id),
            ),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        return [
          { type: "Post", id },
          { type: "Post", id: "LIST" },
          { type: "Post", id: "FEED" },
        ];
      },
    }),

    deleteRepost: builder.mutation({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        return {
          url: `/posts/${id}/repost`,
          method: "DELETE",
        };
      },
      async onQueryStarted(
        arg: string | { id: string; threadId?: string },
        { dispatch, queryFulfilled, getState },
      ) {
        const id = typeof arg === "string" ? arg : arg.id;
        const threadId = typeof arg === "string" ? undefined : arg.threadId;

        const updateRepostInDraft = (
          draft: any,
          targetId: string,
          isDelete = true,
        ) => {
          let post;
          if (Array.isArray(draft)) {
            post = draft.find((p: any) => p.id === targetId);
          } else if (draft?.posts) {
            post = draft.posts.find((p: any) => p.id === targetId);
          } else if (draft?.id === targetId) {
            post = draft;
          }

          if (post) {
            post.repostedByMe = !isDelete;
            post.repostsCount = Math.max(
              0,
              (post.repostsCount || 0) + (isDelete ? -1 : 1),
            );
            if (post._count) post._count.reposts = post.repostsCount;
          }
        };

        const patches = [
          dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type: "public", cursor: null } as any,
              (draft) => updateRepostInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData(
              "getFeed",
              { cursor: null } as any,
              (draft) => updateRepostInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getPost", id, (draft) =>
              updateRepostInDraft(draft, id),
            ),
          ),
          dispatch(
            postApi.util.updateQueryData("getThread", id, (draft) =>
              updateRepostInDraft(draft, id),
            ),
          ),
          ...(threadId
            ? [
                dispatch(
                  postApi.util.updateQueryData("getThread", threadId, (draft) =>
                    updateRepostInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getReplies",
                    { id: threadId } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
              ]
            : []),
          // Profile awareness
          ...((getState() as any).auth?.user?.id
            ? [
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserPosts" as any,
                    {
                      id: (getState() as any).auth.user.id,
                      cursor: null,
                    } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserLikes" as any,
                    {
                      id: (getState() as any).auth.user.id,
                      cursor: null,
                    } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
                dispatch(
                  postApi.util.updateQueryData(
                    "getUserReplies" as any,
                    {
                      id: (getState() as any).auth.user.id,
                      cursor: null,
                    } as any,
                    (draft) => updateRepostInDraft(draft, id),
                  ),
                ),
              ]
            : []),
        ];

        // Patch Trending (Explore)
        patches.push(
          dispatch(
            postApi.util.updateQueryData("getTrending" as any, undefined, (draft) =>
              updateRepostInDraft(draft, id),
            ),
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
      invalidatesTags: (result, error, arg) => {
        const id = typeof arg === "string" ? arg : arg.id;
        return [
          { type: "Post", id },
          { type: "Post", id: "LIST" },
          { type: "Post", id: "FEED" },
        ];
      },
    }),

    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    getThread: builder.query({
      query: (id) => `/posts/${id}/thread`,
      transformResponse: (res: any) => transformNormalizedResponse(res).posts,
      keepUnusedDataFor: 90,
      refetchOnReconnect: true,
      providesTags: (result, error, id) =>
        result
          ? [
              ...result.map((p: any) => ({ type: "Post" as const, id: p.id })),
              { type: "Post", id: `THREAD-${id}` },
            ]
          : [{ type: "Post", id: `THREAD-${id}` }],
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
      keepUnusedDataFor: 90,
      refetchOnReconnect: true,
      providesTags: (result, error, { id }) =>
        result?.posts
          ? [
              ...result.posts.map((p: any) => ({
                type: "Post" as const,
                id: p.id,
              })),
              { type: "Post", id: `REPLIES-${id}` },
            ]
          : [{ type: "Post", id: `REPLIES-${id}` }],
    }),

    replyPost: builder.mutation({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/reply`,
        method: "POST",
        body: { content },
      }),
      async onQueryStarted(
        { postId, content },
        { dispatch, queryFulfilled, getState },
      ) {
        const currentUser = (getState() as any).auth?.user;
        const tempId = `temp-${Date.now()}`;

        // Optimistically insert into global thread if this is the thread we are looking at
        // Note: We don't know the rootId easily here, but we can try to update
        // the thread for the parent postId itself if it's a direct reply.
        const patchThread = dispatch(
          postApi.util.updateQueryData(
            "getThread" as any,
            postId,
            (draft: any) => {
              if (Array.isArray(draft)) {
                draft.push({
                  id: tempId,
                  content,
                  createdAt: new Date().toISOString(),
                  author: currentUser || { name: "You", username: "me" },
                  replyToId: postId,
                  _count: { likes: 0, replies: 0, reposts: 0 },
                  isLiked: false,
                });
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchThread.undo();
        }
      },
      invalidatesTags: (result, error, { postId }) => [
        { type: "Post", id: postId }, // Refetch parent to update reply count
        { type: "Post", id: `THREAD-${postId}` }, // Refetch current thread if it was parent
        { type: "Post", id: `REPLIES-${postId}` }, // Refetch replies list
        { type: "Post", id: "FEED" }, // Possible update in feed
      ],
    }),

    incrementViewCount: builder.mutation({
      query: ({ postId }) => ({
        url: `/posts/${postId}/view`,
        method: "POST",
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        const updateList = (endpointName: string, args: any) =>
          dispatch(
            postApi.util.updateQueryData(
              endpointName as any,
              args,
              (draft: any) => {
                if (!draft?.posts) return;
                const post = draft.posts.find((p: any) => p.id === postId);
                if (post) post.viewCount = (post.viewCount || 0) + 1;
              },
            ),
          );

        updateList("getPosts", { type: "public", cursor: null } as any);
        updateList("getPosts", { type: "private", cursor: null } as any);
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
          postApi.util.updateQueryData(
            "getPosts",
            { type: "public", cursor: null } as any,
            (draft) => {
              if (draft?.posts) {
                draft.posts = draft.posts.filter(
                  (p: any) => p.id !== id && p.originalPost?.id !== id,
                );
              }
            },
          ),
        );
        const patchFeed = dispatch(
          postApi.util.updateQueryData(
            "getFeed",
            { cursor: null } as any,
            (draft) => {
              if (draft?.posts) {
                draft.posts = draft.posts.filter((p: any) => {
                  if (p.isRepost && p.originalPost?.id === id) return false;
                  if (p.id === id) return false;
                  return true;
                });
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchFeed.undo();
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
        { type: "Post", id: "FEED" },
      ],
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
      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }],
    }),

    blockPost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Post", id }],
    }),

    blockUser: builder.mutation({
      query: ({ id }) => ({
        url: `/profile/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Post", id: "LIST" },
        { type: "Post", id: "FEED" },
      ],
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
