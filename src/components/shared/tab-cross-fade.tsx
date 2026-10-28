import React from "react";

/**
 * Cross-fades tab content when the active tab changes. Re-keying the wrapper
 * remounts it, so the entrance animation plays on every switch. Reduced-motion
 * users get the content immediately.
 */
export function TabCrossFade({
  tabKey,
  children,
  className,
}: {
  tabKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      key={tabKey}
      data-testid="tab-cross-fade"
      className={className ? `tab-cross-fade ${className}` : "tab-cross-fade"}
    >
      {children}
    </div>
  );
}
