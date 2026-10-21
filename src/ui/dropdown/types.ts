import type { ReactNode } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  /**
   * Optional content rendered before the label in both the trigger
   * (when this option is selected) and each menu row. Used for things
   * like status indicators; not searchable.
   */
  prefix?: ReactNode;
  /**
   * Optional content rendered after the label in each menu row (not the
   * trigger), such as a row actions menu. Clicks on it must stop
   * propagation so they do not select the row.
   */
  suffix?: ReactNode;
}
