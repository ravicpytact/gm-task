import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionKeys, type Session } from "@/lib/auth/session-query";
import { WelcomeTour } from "./welcome-tour";

const completeTour = vi.fn();
vi.mock("../api", () => ({ completeTour: () => completeTour() }));

function session(tourCompletedAt: string | null): Session {
  return {
    user: {
      id: "u1",
      email: "ravi@example.com",
      first_name: "Ravi",
      last_name: "Patel",
      role: { id: "r1", code: "USER", name: "User" },
      status: "ACTIVE",
      tour_completed_at: tourCompletedAt,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
      created_by: null,
      updated_by: null,
    } as Session["user"],
    role: { id: "r1", code: "USER", name: "User" } as Session["role"],
    permissions: [],
  };
}

function renderWith(s: Session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(sessionKeys.current(), s);
  render(
    <QueryClientProvider client={client}>
      <WelcomeTour />
    </QueryClientProvider>,
  );
  return client;
}

describe("WelcomeTour", () => {
  beforeEach(() => {
    completeTour.mockReset();
    completeTour.mockResolvedValue({ ...session("2026-10-05T07:00:00Z").user });
  });

  it("welcomes someone new and records a skip, once", async () => {
    const client = renderWith(session(null));
    expect(screen.getByRole("dialog", { name: /Welcome to TaskDesk, Ravi/ })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    await waitFor(() => expect(completeTour).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).toBeNull();
    // The session now says it is done, so it never shows again.
    await waitFor(() =>
      expect(client.getQueryData<Session>(sessionKeys.current())?.user.tour_completed_at).toBe(
        "2026-10-05T07:00:00Z",
      ),
    );
  });

  it("shows nothing to someone who has seen it", () => {
    renderWith(session("2026-10-01T09:00:00Z"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("counts the tour as seen when there is nothing on screen to point at", async () => {
    renderWith(session(null));
    await userEvent.click(screen.getByRole("button", { name: "Take a quick tour" }));
    await waitFor(() => expect(completeTour).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
