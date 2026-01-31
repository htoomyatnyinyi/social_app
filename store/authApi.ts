import { api } from "./api";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    signin: builder.mutation({
      query: (credentials) => ({
        url: "/auth/signin",
        method: "POST",
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: "/auth/signup",
        method: "POST",
        body: userData,
      }),
    }),
    searchUsers: builder.query({
      query: (search) => `/auth/users?search=${search}`,
    }),
  }),
});

export const { useSigninMutation, useSignupMutation, useSearchUsersQuery } =
  authApi;
