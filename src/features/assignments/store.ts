import { create } from "zustand";
import { registerStoreReset } from "@/lib/stores/registry";
import type { AnswerDraft } from "./utils";

// Answers chosen on the Todos screen but not yet submitted (contract §3: choose, then Submit). Client
// state only: shared by the table and the phone cards, kept while the day, filter or page changes,
// cleared on sign-out (FE-DATA-006) because it is the signed-in person's data.

type DraftState = {
  drafts: Record<string, AnswerDraft>;
  /** Per Todo: why it was not sent (an invalid value, or the server's message). */
  errors: Record<string, string>;
  setDraft: (todoId: string, draft: AnswerDraft | null) => void;
  setErrors: (errors: Record<string, string>) => void;
  /** Forget these Todos' drafts and errors (sent, gone), or all of them. */
  clear: (todoIds?: string[]) => void;
};

const empty = { drafts: {}, errors: {} };

export const useAnswerDrafts = create<DraftState>()((set) => ({
  ...empty,
  setDraft: (todoId, draft) =>
    set((state) => {
      const drafts = { ...state.drafts };
      const errors = { ...state.errors };
      if (draft && (draft.choice || draft.text)) drafts[todoId] = draft;
      else delete drafts[todoId];
      delete errors[todoId]; // a change clears its old error
      return { drafts, errors };
    }),
  setErrors: (errors) => set({ errors }),
  clear: (todoIds) =>
    set((state) => {
      if (!todoIds) return empty;
      const drafts = { ...state.drafts };
      const errors = { ...state.errors };
      for (const id of todoIds) {
        delete drafts[id];
        delete errors[id];
      }
      return { drafts, errors };
    }),
}));

registerStoreReset(() => useAnswerDrafts.setState(empty));
