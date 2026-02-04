import { api } from "./api";

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/settings/change-password",
        method: "POST",
        body: data,
      }),
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: "/settings/account",
        method: "DELETE",
      }),
    }),
  }),
});

export const { useChangePasswordMutation, useDeleteAccountMutation } =
  settingsApi;
