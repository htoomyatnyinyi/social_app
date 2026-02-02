import { api } from "./api";

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: (id) => `/profile/${id}`,
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/profile/update",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User", "Post"],
    }),
    followUser: builder.mutation({
      query: (id) => ({
        url: `/profile/${id}/follow`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Post"],
    }),
    getFollowers: builder.query({
      query: (id) => `/profile/${id}/followers`,
      providesTags: ["User"],
    }),
    getFollowing: builder.query({
      query: (id) => `/profile/${id}/following`,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useFollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
} = profileApi;
