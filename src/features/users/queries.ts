import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { browserApi } from "@/lib/api/browser";
import { sessionKeys } from "@/lib/auth/session-query";
import { invalidateAllExceptSession } from "@/lib/query/invalidate";
import {
  changeUserStatus,
  deleteUser,
  getDeletePreview,
  getMyProfile,
  getUser,
  inviteUser,
  listRoles,
  listUsers,
  resendInvitation,
  sendPasswordLink,
  updateMyProfile,
} from "./api";
import type { Invite, ProfileUpdate, UserListQuery } from "./types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (query: UserListQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  deletePreview: (id: string) => [...userKeys.all, "delete-preview", id] as const,
  roles: () => [...userKeys.all, "roles"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export const userQueries = {
  list: (query: UserListQuery) =>
    queryOptions({
      queryKey: userKeys.list(query),
      queryFn: () => listUsers(browserApi, query),
      placeholderData: keepPreviousData, // keep the rows while the next page loads
    }),
  /** One user with its version: read when a dialog opens, so a write sends a fresh ETag. */
  detail: (id: string) =>
    queryOptions({
      queryKey: userKeys.detail(id),
      queryFn: () => getUser(browserApi, id),
      staleTime: 0,
    }),
  deletePreview: (id: string) =>
    queryOptions({
      queryKey: userKeys.deletePreview(id),
      queryFn: () => getDeletePreview(browserApi, id),
      staleTime: 0,
    }),
  roles: () =>
    queryOptions({
      queryKey: userKeys.roles(),
      queryFn: () => listRoles(browserApi),
      staleTime: Infinity, // seeded by the backend; they do not change while the app runs
    }),
  me: () => queryOptions({ queryKey: userKeys.me(), queryFn: () => getMyProfile(browserApi) }),
};

export const useUserList = (query: UserListQuery) => useQuery(userQueries.list(query));
export const useRoles = () => useQuery(userQueries.roles());
export const useMyProfile = () => useQuery(userQueries.me());
export const useUser = (id: string | null) =>
  useQuery({ ...userQueries.detail(id ?? ""), enabled: id !== null });
export const useDeletePreview = (id: string | null) =>
  useQuery({ ...userQueries.deletePreview(id ?? ""), enabled: id !== null });

/** A 412: someone changed the user meanwhile. Fetch the new version so a retry can succeed. */
function refetchOnConflict(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return (error: unknown) => {
    if (error instanceof ApiError && error.status === 412) {
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    }
  };
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invite: Invite) => inviteUser(browserApi, invite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

/** Neither changes a user's visible data; there is nothing to invalidate. */
export const useResendInvitation = () =>
  useMutation({ mutationFn: (userId: string) => resendInvitation(browserApi, userId) });
export const useSendPasswordLink = () =>
  useMutation({ mutationFn: (userId: string) => sendPasswordLink(browserApi, userId) });

export function useChangeUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; etag: string; status: "ACTIVE" | "INACTIVE" }) =>
      changeUserStatus(browserApi, v.id, v.etag, v.status),
    onSuccess: (result, v) => {
      queryClient.setQueryData(userKeys.detail(v.id), result);
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error, v) => refetchOnConflict(queryClient, v.id)(error),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; etag: string }) => deleteUser(browserApi, v.id, v.etag),
    onSuccess: (_result, v) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(v.id) });
      queryClient.removeQueries({ queryKey: userKeys.deletePreview(v.id) });
      // A deleted user's assignments, todos, history and report rows go too (FE-DATA-003).
      return invalidateAllExceptSession(queryClient);
    },
    onError: (error, v) => refetchOnConflict(queryClient, v.id)(error),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { etag: string; body: ProfileUpdate }) =>
      updateMyProfile(browserApi, v.etag, v.body),
    onSuccess: (result) => {
      queryClient.setQueryData(userKeys.me(), result);
      // The name in the header comes from the session, and the User List shows it too.
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all });
      return queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 412) {
        void queryClient.invalidateQueries({ queryKey: userKeys.me() });
      }
    },
  });
}
