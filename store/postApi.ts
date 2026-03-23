import { api } from "./api";

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
      serializeQueryArgs: ({ queryArgs }) => {
        return `getPosts-${queryArgs.type}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (!arg.cursor) {
          // Reset if no cursor (refresh)
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
      serializeQueryArgs: ({ queryArgs }) => {
        return "getFeed";
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
      async onQueryStarted({ postId }, { dispatch, queryFulfilled, getState }) {
        const userId = (getState() as any).auth.user?.id;
        if (!userId) return;

        // We need to update both public and private lists if they exist in cache
        const updateCache = (type: string) => {
          return dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type } as any,
              (draft) => {
                if (!draft?.posts) return;
                const post = draft.posts.find((p: any) => p.id === postId);
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
              },
            ),
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
      invalidatesTags: ["Post"],
    }),

    bookmarkPost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/bookmark`,
        method: "POST",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const userId = (getState() as any).auth.user?.id;
        if (!userId) return;

        const updateCache = (draft: any) => {
          if (!draft) return;
          // Handle both single post (getPost) and list of posts (getPosts/getFeed)
          const posts = draft.posts || [draft];
          const post = posts.find((p: any) => p.id === id);
          
          if (post) {
            const hasBookmarked = post.bookmarks?.some(
              (b: any) => b.userId === userId,
            );
            
            if (hasBookmarked) {
              post.bookmarks = post.bookmarks.filter(
                (b: any) => b.userId !== userId,
              );
            } else {
              post.bookmarks = [...(post.bookmarks || []), { userId }];
            }
          }
        };

        // Update various caches
        const patchPublic = dispatch(
          postApi.util.updateQueryData("getPosts", { type: "public", cursor: null } as any, updateCache)
        );
        const patchPrivate = dispatch(
          postApi.util.updateQueryData("getPosts", { type: "private", cursor: null } as any, updateCache)
        );
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: null } as any, updateCache)
        );
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", id, updateCache)
        );
        const patchBookmarks = dispatch(
          postApi.util.updateQueryData("getBookmarks", undefined, (draft) => {
            if (Array.isArray(draft)) {
              // If we are un-bookmarking, remove from list.
              // If bookmarking, we'd need the full post object which we might not have here.
              // So we just filter out if present.
              return draft.filter((p: any) => p.id !== id);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchPrivate.undo();
          patchFeed.undo();
          patchPost.undo();
          patchBookmarks.undo();
        }
      },
      invalidatesTags: (result, error, id) => [{ type: "Post", id }],
    }),

    repostPost: builder.mutation({
      query: ({ id, content, image, images }) => ({
        url: `/posts/${id}/repost`,
        method: "POST",
        body: { content, image, images },
      }),
      async onQueryStarted(
        { id, content },
        { dispatch, queryFulfilled, getState },
      ) {
        if (content) return; // Don't optimistically update quotes

        const userId = (getState() as any).auth.user?.id;
        if (!userId) return;

        const updateCache = (draft: any) => {
          if (!draft?.posts) return;
          const post = draft.posts.find((p: any) => p.id === id);
          if (post) {
            post.repostsCount = (post.repostsCount || 0) + 1;
            post.repostedByMe = true;
            // Also update the array for UI consistency
            if (post.repostedBy) {
              // Avoid duplicates
              if (!post.repostedBy.some((r: any) => r.userId === userId)) {
                post.repostedBy.push({ userId });
              }
            } else {
              post.repostedBy = [{ userId }];
            }
            if (post._count)
              post._count.reposts = (post._count.reposts || 0) + 1;
          }
        };

        const patchGetPosts = dispatch(
          postApi.util.updateQueryData(
            "getPosts",
            { type: "public", cursor: null } as any,
            updateCache,
          ),
        );
        const patchGetFeed = dispatch(
          postApi.util.updateQueryData(
            "getFeed",
            { cursor: null } as any,
            updateCache,
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchGetPosts.undo();
          patchGetFeed.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),
    deleteRepost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/repost`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const userId = (getState() as any).auth.user?.id;
        if (!userId) return;

        const updateCache = (draft: any) => {
          if (!draft?.posts) return;
          const post = draft.posts.find((p: any) => p.id === id);
          if (post) {
            post.repostsCount = Math.max(0, (post.repostsCount || 0) - 1);
            post.repostedByMe = false;
            // Remove from array
            if (post.repostedBy) {
              post.repostedBy = post.repostedBy.filter(
                (r: any) => r.userId !== userId,
              );
            }
            if (post._count)
              post._count.reposts = Math.max(0, (post._count.reposts || 0) - 1);
          }
        };

        const patchGetPosts = dispatch(
          postApi.util.updateQueryData(
            "getPosts",
            { type: "public", cursor: null } as any,
            updateCache,
          ),
        );
        const patchGetFeed = dispatch(
          postApi.util.updateQueryData(
            "getFeed",
            { cursor: null } as any,
            updateCache,
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchGetPosts.undo();
          patchGetFeed.undo();
        }
      },
      invalidatesTags: ["Post"],
    }),
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),
    getComments: builder.query({
      query: (id) => `/posts/${id}/comments`,
      providesTags: (result, error, id) => [{ type: "Comment", id: `LIST_${id}` }],
    }),
    commentPost: builder.mutation({
      query: ({ postId, content, parentId }) => ({
        url: `/posts/${postId}/comment`,
        method: "POST",
        body: { content, parentId },
      }),
      async onQueryStarted(
        { postId, content, parentId },
        { dispatch, queryFulfilled, getState },
      ) {
        const user = (getState() as any).auth.user;
        const tempId = Date.now().toString();

        // 1. Optimistically increment comment count in post lists/detail
        const updateCount = (draft: any) => {
          if (!draft) return;
          const posts = draft.posts || [draft];
          const post = posts.find((p: any) => p.id === postId);
          if (post) {
            post._count.comments = (post._count.comments || 0) + 1;
          }
        };

        const patchPublic = dispatch(
          postApi.util.updateQueryData("getPosts", { type: "public", cursor: null } as any, updateCount)
        );
        const patchPrivate = dispatch(
          postApi.util.updateQueryData("getPosts", { type: "private", cursor: null } as any, updateCount)
        );
        const patchFeed = dispatch(
          postApi.util.updateQueryData("getFeed", { cursor: null } as any, updateCount)
        );
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", postId, updateCount)
        );

        // 2. Optimistically add the comment to the comments list
        const patchComments = dispatch(
          postApi.util.updateQueryData(
            "getComments",
            postId,
            (draft: any) => {
              if (draft) {
                const newComment = {
                  id: tempId,
                  content,
                  userId: user.id,
                  postId: postId,
                  parentId: parentId || null,
                  createdAt: new Date().toISOString(),
                  user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    image: user.image,
                  },
                  replies: [],
                  _count: { replies: 0, commentLikes: 0, commentReposts: 0 },
                  sending: true,
                };

                if (!parentId) {
                  draft.unshift(newComment);
                } else {
                  // If it's a reply, find the parent and add to its replies
                  const findAndAddReply = (comments: any[]) => {
                    for (const comment of comments) {
                      if (comment.id === parentId) {
                        comment.replies = [...(comment.replies || []), newComment];
                        comment._count.replies = (comment._count.replies || 0) + 1;
                        return true;
                      }
                      if (comment.replies && findAndAddReply(comment.replies)) {
                        return true;
                      }
                    }
                    return false;
                  };
                  findAndAddReply(draft);
                }
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchPrivate.undo();
          patchFeed.undo();
          patchPost.undo();
          patchComments.undo();
        }
      },
      invalidatesTags: (result, error, { postId }) => [
        { type: "Comment", id: `LIST_${postId}` },
        { type: "Post", id: postId },
      ],
    }),

    incrementViewCount: builder.mutation({
      query: ({ postId }) => ({
        url: `/posts/${postId}/view`,
        method: "POST",
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        // Optimistically increment view/share count
        const updateCache = (type: string) => {
          return dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type } as any,
              (draft) => {
                if (!draft?.posts) return;
                const post = draft.posts.find((p: any) => p.id === postId);
                if (post) {
                  post.views = (post.views || 0) + 1;
                }
              },
            ),
          );
        };

        updateCache("public");
        updateCache("private");
        dispatch(
          postApi.util.updateQueryData("getPost", postId, (draft: any) => {
            if (draft) {
              draft.views = (draft.views || 0) + 1;
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          console.log("View count increment failed, keeping optimistic update");
        }
      },
    }),
    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        // Remove from Public Posts
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

        // Remove from Feed (handling virtual IDs "repost_ID" and plain IDs)
        const patchFeed = dispatch(
          postApi.util.updateQueryData(
            "getFeed",
            { cursor: null } as any,
            (draft) => {
              if (draft?.posts) {
                draft.posts = draft.posts.filter((p: any) => {
                  // If it's a repost of this post, remove it?
                  // Virtual ID logic: "repost_xyz". originalPost.id === id.
                  if (p.isRepost && p.originalPost?.id === id) return false;
                  // If it's the post itself
                  if (p.id === id) return false;
                  return true;
                });
              }
            },
          ),
        );

        // Remove from Private Posts
        const patchPrivate = dispatch(
          postApi.util.updateQueryData(
            "getPosts",
            { type: "private", cursor: null } as any,
            (draft) => {
              if (draft?.posts) {
                draft.posts = draft.posts.filter(
                  (p: any) => p.id !== id && p.originalPost?.id !== id,
                );
              }
            },
          ),
        );

        // Remove from Bookmarks
        const patchBookmarks = dispatch(
          postApi.util.updateQueryData("getBookmarks", undefined, (draft) => {
            if (Array.isArray(draft)) {
              return draft.filter((p: any) => p.id !== id);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchPublic.undo();
          patchFeed.undo();
          patchPrivate.undo();
          patchBookmarks.undo();
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
    getComment: builder.query({
      query: (id) => `/posts/comment/${id}`,
      providesTags: (result, error, id) => [{ type: "Comment", id }],
    }),
    likeComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comment/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: "Comment", id: `LIST_${postId}` }],
    }),
    repostComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comment/${commentId}/repost`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: "Comment", id: `LIST_${postId}` }],
    }),
    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comment/${commentId}`,
        method: "DELETE",
      }),
      async onQueryStarted(
        { postId, commentId },
        { dispatch, queryFulfilled },
      ) {
        // 1. Decrement comment count on post
        const updatePostCount = (draft: any) => {
          if (!draft) return;
          const posts = draft.posts || [draft];
          const post = posts.find((p: any) => p.id === postId);
          if (post && post._count.comments > 0) {
            post._count.comments -= 1;
          }
        };

        const patchesCount = [
          dispatch(postApi.util.updateQueryData("getPosts", { type: "public", cursor: null } as any, updatePostCount)),
          dispatch(postApi.util.updateQueryData("getPosts", { type: "private", cursor: null } as any, updatePostCount)),
          dispatch(postApi.util.updateQueryData("getFeed", { cursor: null } as any, updatePostCount)),
          dispatch(postApi.util.updateQueryData("getPost", postId, updatePostCount)),
        ];

        // 2. Remove comment from the list
        const patchComments = dispatch(
          postApi.util.updateQueryData("getComments", postId, (draft: any) => {
            if (!draft) return;
            
            const removeFromList = (list: any[]) => {
              for (let i = 0; i < list.length; i++) {
                if (list[i].id === commentId) {
                  list.splice(i, 1);
                  return true;
                }
                if (list[i].replies && removeFromList(list[i].replies)) {
                  list[i]._count.replies = Math.max(0, (list[i]._count.replies || 0) - 1);
                  return true;
                }
              }
              return false;
            };
            removeFromList(draft);
          })
        );

        // 3. Remove single getComment cache if it exists
        const patchComment = dispatch(
          postApi.util.updateQueryData("getComment", commentId, () => {
             return undefined; // Or mark as deleted
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchesCount.forEach(p => p.undo());
          patchComments.undo();
          patchComment.undo();
        }
      },
      invalidatesTags: (result, error, { postId }) => [
        { type: "Comment", id: `LIST_${postId}` },
        { type: "Post", id: postId },
      ],
    }),
    incrementCommentViewCount: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comment/${commentId}/view`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { commentId }) => [{ type: "Comment", id: commentId }],
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
  useIncrementViewCountMutation,
  useBookmarkPostMutation,
  useBlockPostMutation,
  useGetBookmarksQuery,
  useBlockUserMutation,
  useDeleteRepostMutation,
  useReportPostMutation,
  useGetCommentQuery,
  useLikeCommentMutation,
  useRepostCommentMutation,
  useDeleteCommentMutation,
  useIncrementCommentViewCountMutation,
} = postApi;
