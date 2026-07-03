"use client";

import React from "react";

import { ToggleSwitchVisual } from "@/src/components/ui/toggle-switch";
import { cn } from "@/src/lib/utils";

interface SettingsSwitchProps {
  testId?: string;
  name?: string;
  onToggle?: (value: boolean) => void;
  defaultIsToggled?: boolean;
  isToggled?: boolean;
  isDisabled?: boolean;
  togglePosition?: "left" | "right";
}

export function SettingsSwitch({
  children,
  testId,
  name,
  onToggle,
  defaultIsToggled,
  isToggled: controlledIsToggled,
  isDisabled,
  togglePosition = "left",
}: React.PropsWithChildren<SettingsSwitchProps>) {
  const [uncontrolledIsToggled, setUncontrolledIsToggled] = React.useState(
    defaultIsToggled ?? false,
  );
  const isControlled = controlledIsToggled !== undefined;
  const isToggled = isControlled ? controlledIsToggled : uncontrolledIsToggled;

  const handleToggle = (value: boolean) => {
    if (isDisabled) {
      return;
    }
    if (!isControlled) {
      setUncontrolledIsToggled(value);
    }
    onToggle?.(value);
  };

  const input = (
    <input
      hidden
      data-testid={testId}
      name={name}
      type="checkbox"
      onChange={(event) => handleToggle(event.target.checked)}
      checked={isToggled}
      disabled={isDisabled}
    />
  );

  const toggle = <ToggleSwitchVisual enabled={isToggled} />;

  const label = children ? (
    <div className="flex items-center gap-1">
      <span className="text-sm">{children}</span>
    </div>
  ) : null;

  return (
    <label
      className={cn(
        "flex items-center gap-2",
        togglePosition === "right" ? "w-full justify-between" : "w-fit",
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      {input}
      {togglePosition === "right" ? (
        <>
          {label}
          {toggle}
        </>
      ) : (
        <>
          {toggle}
          {label}
        </>
      )}
    </label>
  );
}
