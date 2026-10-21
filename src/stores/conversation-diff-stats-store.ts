import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Git state of a conversation's workspace, shown as the row's branch icon. */
export type ConversationGitState =
  | "clean"
  | "modified"
  | "staged"
  | "untracked"
  | "ahead"
  | "conflict";

export interface ConversationDiffTotals {
  additions: number;
  deletions: number;
  /** Optional: when absent the icon is derived from the line totals. */
  gitState?: ConversationGitState;
}

/**
 * Last-known line totals per conversation, written by the open conversation's
 * overview diffs row. The sidebar list cannot compute these itself: diff
 * stats need a running workspace, so rows show the most recent totals the app
 * saw instead of fetching each conversation.
 */
interface ConversationDiffStatsState {
  diffTotalsByConversationId: Record<string, ConversationDiffTotals>;
  setConversationDiffTotals: (
    conversationId: string,
    totals: ConversationDiffTotals,
  ) => void;
}

export const useConversationDiffStatsStore =
  create<ConversationDiffStatsState>()(
    persist(
      (set) => ({
        diffTotalsByConversationId: {},
        setConversationDiffTotals: (conversationId, totals) =>
          set((state) => {
            const existing = state.diffTotalsByConversationId[conversationId];
            if (
              existing?.additions === totals.additions &&
              existing?.deletions === totals.deletions &&
              existing?.gitState === totals.gitState
            ) {
              return state;
            }
            return {
              diffTotalsByConversationId: {
                ...state.diffTotalsByConversationId,
                [conversationId]: totals,
              },
            };
          }),
      }),
      {
        name: "conversation-diff-stats",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          diffTotalsByConversationId: state.diffTotalsByConversationId,
        }),
      },
    ),
  );
