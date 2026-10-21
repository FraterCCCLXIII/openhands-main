import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export interface ConversationMinimapScrollRegistration {
  scrollContainerRef: RefObject<HTMLElement | null>;
  visible: boolean;
  /** Loads older chat history when needed, then scrolls to the user turn. */
  navigateToTurn?: (userEventId: string) => void | Promise<void>;
}

interface ConversationMinimapContextValue {
  scrollRegistration: ConversationMinimapScrollRegistration;
  setScrollRegistration: (next: ConversationMinimapScrollRegistration) => void;
}

const EMPTY_SCROLL_REGISTRATION: ConversationMinimapScrollRegistration = {
  scrollContainerRef: { current: null },
  visible: false,
};

const ConversationMinimapContext =
  createContext<ConversationMinimapContextValue | null>(null);

export function ConversationMinimapProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [scrollRegistration, setScrollRegistration] =
    useState<ConversationMinimapScrollRegistration>(EMPTY_SCROLL_REGISTRATION);
  const value = useMemo(
    () => ({ scrollRegistration, setScrollRegistration }),
    [scrollRegistration],
  );
  return (
    <ConversationMinimapContext.Provider value={value}>
      {children}
    </ConversationMinimapContext.Provider>
  );
}

export function useRegisterConversationMinimapScroll(
  registration: ConversationMinimapScrollRegistration,
): void {
  const setScrollRegistration = useContext(
    ConversationMinimapContext,
  )?.setScrollRegistration;
  const { scrollContainerRef, visible, navigateToTurn } = registration;

  useEffect(() => {
    if (!setScrollRegistration) {
      return;
    }
    setScrollRegistration({
      scrollContainerRef,
      visible,
      navigateToTurn,
    });
    return () => {
      setScrollRegistration(EMPTY_SCROLL_REGISTRATION);
    };
  }, [navigateToTurn, scrollContainerRef, setScrollRegistration, visible]);
}

export function useConversationMinimapScrollRegistration(): ConversationMinimapScrollRegistration | null {
  const context = useContext(ConversationMinimapContext);
  return context?.scrollRegistration ?? null;
}
