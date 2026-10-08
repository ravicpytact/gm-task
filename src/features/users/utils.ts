import type { inferParserType } from "nuqs/server";
import { USERS_PAGE_SIZE, userListParsers } from "./constants";
import type { User, UserListQuery } from "./types";

export type UserListParams = inferParserType<typeof userListParsers>;

/**
 * The backend query a User List URL asks for: one mapping, used by the browser and the prefetch.
 * A plain object literal, so a parameter the contract renames or drops fails the type check
 * (conditional spreads would hide it). Empty filters are `undefined` and left out of the request.
 */
export function toUserListQuery(params: UserListParams): UserListQuery {
  return {
    page: params.page,
    page_size: USERS_PAGE_SIZE,
    sort_by: params.sort,
    sort_order: params.order,
    search: params.search || undefined,
    status: params.status ?? undefined,
    role: params.role ?? undefined,
  };
}

export const fullName = (user: Pick<User, "first_name" | "last_name">) =>
  `${user.first_name} ${user.last_name}`;

export const initials = (user: Pick<User, "first_name" | "last_name">) =>
  `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

/** User Detail (contract §5). */
export const userPath = (userId: string) => `/users/${userId}`;
