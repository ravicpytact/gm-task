import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import type { RoleCode, UserSortField, UserStatus } from "./types";

/** Permission codes this feature checks (docs/04-design/acm). The backend enforces them. */
export const USER_PERMISSIONS = {
  readAll: "users.user.read_all",
  invite: "users.user.invite",
  updateStatus: "users.user.update_status",
  delete: "users.user.delete",
  sendPasswordLink: "users.user.send_password_link",
  readOwnProfile: "users.profile.read_own",
  updateOwnProfile: "users.profile.update_own",
} as const;

export const USER_STATUSES: UserStatus[] = ["ACTIVE", "INVITED", "INACTIVE"];
export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  INACTIVE: "Inactive",
};

export const USERS_PAGE_SIZE = 20;
const SORT_FIELDS: UserSortField[] = ["first_name", "email", "created_at"];
/** Role codes are fixed and seeded alike everywhere, so `?role=USER` works in any environment. */
const ROLE_CODES: RoleCode[] = ["ADMIN", "USER"];

/**
 * What the User List shows lives in the URL (FE-DATA-004). These parsers are shared by the
 * browser (useQueryStates) and the server prefetch (createLoader). The defaults are UI defaults
 * for URL parameters, not configuration.
 */
export const userListParsers = {
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
  status: parseAsStringLiteral(USER_STATUSES),
  role: parseAsStringLiteral(ROLE_CODES),
  sort: parseAsStringLiteral(SORT_FIELDS).withDefault("first_name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
};

/** Which part of My Profile is open (?tab=), so a link can open the Password tab directly. */
export const PROFILE_TABS = ["details", "password"] as const;
export const profileTabParser = parseAsStringLiteral(PROFILE_TABS).withDefault("details");

/** The contract's words for a 412 on any user write (docs/04-design/users/ui_data_contract.md). */
export const CHANGED_ELSEWHERE = {
  PRECONDITION_FAILED: "This user was changed by someone else. Refresh and try again.",
};

/** How many items a searchable picker loads per search (the backend allows up to 100). */
export const PICKER_PAGE_SIZE = 50;
