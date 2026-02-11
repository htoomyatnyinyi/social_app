import { api } from "./api";

export const postApi = api.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: ({ type, cursor }) => {
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
    }),

    bookmarkPost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}/bookmarks`,
        method: "POST",
      }),
      invalidatesTags: ["Post"], // Simplified invalidation for now
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
      async onQueryStarted(
        { id, content, parentId },
        { dispatch, queryFulfilled, getState },
      ) {
        const user = (getState() as any).auth.user;
        const tempId = Date.now().toString();

        // 1. Optimistically increment comment count in post lists/detail
        const updateCount = (type: string) => {
          return dispatch(
            postApi.util.updateQueryData(
              "getPosts",
              { type } as any,
              (draft) => {
                if (!draft?.posts) return;
                const post = draft.posts.find((p: any) => p.id === id);
                if (post) {
                  post._count.comments += 1;
                }
              },
            ),
          );
        };

        const patchPublic = updateCount("public");
        const patchPrivate = updateCount("private");
        const patchPost = dispatch(
          postApi.util.updateQueryData("getPost", id, (draft: any) => {
            if (draft) {
              draft._count.comments += 1;
            }
          }),
        );

        // 2. Optimistically add the comment to the comments list
        const patchComments = dispatch(
          postApi.util.updateQueryData(
            "getComments" as any,
            id as any,
            (draft: any) => {
              if (draft && !parentId) {
                // Only add to top-level comments if parentId is null
                draft.unshift({
                  id: tempId,
                  content,
                  userId: user.id,
                  postId: id,
                  parentId: null,
                  createdAt: new Date().toISOString(),
                  user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    image: user.image,
                  },
                  replies: [],
                });
              } else if (draft && parentId) {
                // If it's a reply, find the parent and add to its replies
                const parent = draft.find((c: any) => c.id === parentId);
                if (parent) {
                  parent.replies = [
                    ...(parent.replies || []),
                    {
                      id: tempId,
                      content,
                      userId: user.id,
                      postId: id,
                      parentId,
                      createdAt: new Date().toISOString(),
                      user: {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        image: user.image,
                      },
                    },
                  ];
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
          patchPost.undo();
          patchComments.undo();
        }
      },
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
    // deletePost: builder.mutation({
    //   query: (id) => ({
    //     url: `/posts/${id}`,
    //     method: "DELETE",
    //   }),
    //   invalidatesTags: ["Post"],
    // }),

    deletePost: builder.mutation({
      query: ({ id }) => ({
        url: `/posts/${id}`, // Matches the .delete("/:id") backend route
        method: "DELETE",
      }),
      // Optional: Invalidate tags to refresh the list automatically
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
  useGetCommentsQuery,
  useCommentPostMutation,
  useDeletePostMutation,
  useIncrementViewCountMutation,
  useBookmarkPostMutation,
  useGetBookmarksQuery,
  useBlockPostMutation,
  useBlockUserMutation,
} = postApi;
