import { unwrap, unwrapEmpty, unwrapWithEtag, type ApiClient } from "@/lib/api";
import type { Invite, ProfileUpdate, UserListQuery } from "./types";

// User management (backend `users`) and the invitation actions started from the User List
// (backend `auth`). The frontend slice follows the screen, not the backend package.

export const listUsers = (api: ApiClient, query: UserListQuery) =>
  unwrap(api.GET("/v1/users", { params: { query } }));

export const getUser = (api: ApiClient, userId: string) =>
  unwrapWithEtag(api.GET("/v1/users/{user_id}", { params: { path: { user_id: userId } } }));

export const changeUserStatus = (
  api: ApiClient,
  userId: string,
  etag: string,
  status: "ACTIVE" | "INACTIVE",
) =>
  unwrapWithEtag(
    api.PATCH("/v1/users/{user_id}", {
      params: { path: { user_id: userId }, header: { "If-Match": etag } },
      body: { status },
    }),
  );

export const getDeletePreview = (api: ApiClient, userId: string) =>
  unwrap(api.GET("/v1/users/{user_id}/delete-preview", { params: { path: { user_id: userId } } }));

export const deleteUser = (api: ApiClient, userId: string, etag: string) =>
  unwrapEmpty(
    api.DELETE("/v1/users/{user_id}", {
      params: { path: { user_id: userId }, header: { "If-Match": etag } },
    }),
  );

export const listRoles = (api: ApiClient) => unwrap(api.GET("/v1/roles"));

export const inviteUser = (api: ApiClient, body: Invite) =>
  unwrap(api.POST("/v1/invitations", { body }));

export const resendInvitation = (api: ApiClient, userId: string) =>
  unwrap(api.POST("/v1/users/{user_id}/invitations", { params: { path: { user_id: userId } } }));

export const sendPasswordLink = (api: ApiClient, userId: string) =>
  unwrap(api.POST("/v1/users/{user_id}/password-links", { params: { path: { user_id: userId } } }));

export const getMyProfile = (api: ApiClient) => unwrapWithEtag(api.GET("/v1/me"));

export const updateMyProfile = (api: ApiClient, etag: string, body: ProfileUpdate) =>
  unwrapWithEtag(api.PATCH("/v1/me", { params: { header: { "If-Match": etag } }, body }));
