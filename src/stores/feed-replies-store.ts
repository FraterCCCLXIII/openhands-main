import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FeedTeamAuthorKind } from "#/utils/feed-team-demo";

/** A reply written in a feed card's thread, by the user or a simulated person. */
export interface FeedReply {
  id: string;
  conversationId: string;
  /** The message this answers; the thread tree is rebuilt from it. */
  parentId: string;
  /** `you` for the user, else the simulated teammate's, agent's or subagent's name. */
  personId: string;
  author: string;
  kind: FeedTeamAuthorKind;
  text: string;
  timestamp: string;
}

interface FeedRepliesState {
  replies: FeedReply[];
}

interface FeedRepliesActions {
  addReply: (reply: FeedReply) => void;
}

// Keeps the browser-local history bounded; oldest replies fall off first.
const MAX_REPLIES = 500;

/** Owns every reply written in feed threads; the profile pages read from it. */
export const useFeedRepliesStore = create<
  FeedRepliesState & FeedRepliesActions
>()(
  persist(
    (set) => ({
      replies: [],
      addReply: (reply) =>
        set((state) => ({
          replies: [...state.replies, reply].slice(-MAX_REPLIES),
        })),
    }),
    {
      name: "feed-replies",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
