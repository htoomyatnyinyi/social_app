import { api } from "./api";

export const searchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
      transformResponse: (response: any) => {
        if (response.posts && response.posts.posts && response.posts.users) {
          const { posts, users } = response.posts;
          response.posts = posts.map((post: any) => {
            if (post.authorId && users[post.authorId]) {
              post.author = users[post.authorId];
            }
            if (post.originalPost && post.originalPost.authorId && users[post.originalPost.authorId]) {
              post.originalPost.author = users[post.originalPost.authorId];
            }
            if (post.parentPost && post.parentPost.authorId && users[post.parentPost.authorId]) {
              post.parentPost.author = users[post.parentPost.authorId];
            }
            return post;
          });
        }
        return response;
      },
      providesTags: ["User", "Post"],
    }),
    getTrending: builder.query<any, void>({
      query: () => "/search/trending",
      providesTags: ["Post"],
    }),
  }),
});

export const { useGlobalSearchQuery, useGetTrendingQuery } = searchApi;
