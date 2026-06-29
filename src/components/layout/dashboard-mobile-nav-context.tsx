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

export function useDashboardMobileNav(): DashboardMobileNavContextValue {
  const context = React.useContext(DashboardMobileNavContext);
  if (!context) {
    throw new Error(
      "useDashboardMobileNav must be used within DashboardMobileNavProvider",
    );
  }
  return context;
}
