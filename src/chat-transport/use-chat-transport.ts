import React from "react";
import { createLocalChatTransport } from "./local-adapter";
import type { ChatTransport } from "./types";

/** The active chat transport; local-only until a network adapter is opted in. */
export function useChatTransport(): ChatTransport {
  return React.useMemo(() => createLocalChatTransport(), []);
}
