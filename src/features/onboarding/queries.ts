import { useMutation, useQueryClient } from "@tanstack/react-query";
import { browserApi } from "@/lib/api/browser";
import { sessionKeys, type Session } from "@/lib/auth/session-query";
import { completeTour } from "./api";

/** Records the tour as done; the session's profile is updated in place, so it never reopens. */
export function useCompleteTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeTour(browserApi),
    onSuccess: (user) =>
      queryClient.setQueryData<Session>(sessionKeys.current(), (session) =>
        session ? { ...session, user } : session,
      ),
  });
}
