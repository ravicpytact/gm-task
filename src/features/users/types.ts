import type { Operations, Schemas } from "@/lib/api";

export type User = Schemas["UserRead"];
export type Role = Schemas["RoleRead"];
export type DeletePreview = Schemas["UserDeletePreviewRead"];
export type Invite = Schemas["InviteRequest"];
export type ProfileUpdate = Schemas["ProfileUpdate"];

export type UserListQuery = NonNullable<
  Operations["list_users_v1_users_get"]["parameters"]["query"]
>;
export type UserStatus = NonNullable<UserListQuery["status"]>;
export type UserSortField = NonNullable<UserListQuery["sort_by"]>;
export type RoleCode = NonNullable<UserListQuery["role"]>;
