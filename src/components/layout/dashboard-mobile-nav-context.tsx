"use client";

import React from "react";

interface DashboardMobileNavContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DashboardMobileNavContext =
  React.createContext<DashboardMobileNavContextValue | null>(null);

export function DashboardMobileNavProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((current) => !current), []);

  const value = React.useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle],
  );

  return (
    <DashboardMobileNavContext.Provider value={value}>
      {children}
    </DashboardMobileNavContext.Provider>
  );
}

const noop = () => undefined;

const fallbackDashboardMobileNavContext: DashboardMobileNavContextValue = {
  isOpen: false,
  open: noop,
  close: noop,
  toggle: noop,
};

export function useDashboardMobileNav(): DashboardMobileNavContextValue {
  return React.useContext(DashboardMobileNavContext) ?? fallbackDashboardMobileNavContext;
}
