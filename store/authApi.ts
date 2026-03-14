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
    googleAuth: builder.mutation({
      query: (tokenData) => ({
        url: "/auth/google",
        method: "POST",
        body: tokenData,
      }),
    }),
    verifyCode: builder.mutation({
      query: (verifyData) => ({
        url: "/auth/verify",
        method: "POST",
        body: verifyData,
      }),
    }),
    searchUsers: builder.query({
      query: (search) => `/auth/users?search=${search}`,
    }),
  }),
});

export const { useSigninMutation, useSignupMutation, useGoogleAuthMutation, useVerifyCodeMutation, useSearchUsersQuery } =
  authApi;
