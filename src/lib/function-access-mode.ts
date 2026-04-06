import type { FunctionAccessMode } from "@/src/types/context-layer";

const accessModePriority: Record<FunctionAccessMode, number> = {
  disabled: 0,
  approval_required: 1,
  enabled: 2,
};

export const functionAccessModes: FunctionAccessMode[] = [
  "enabled",
  "approval_required",
  "disabled",
];

export const clampFunctionAccessMode = (
  requested: FunctionAccessMode,
  maximum: FunctionAccessMode,
): FunctionAccessMode =>
  accessModePriority[requested] <= accessModePriority[maximum]
    ? requested
    : maximum;

export const isFunctionAccessModeAllowed = (
  requested: FunctionAccessMode,
  maximum: FunctionAccessMode,
) => clampFunctionAccessMode(requested, maximum) === requested;

export const getAllowedFunctionAccessModes = (maximum: FunctionAccessMode) =>
  functionAccessModes.filter((mode) => isFunctionAccessModeAllowed(mode, maximum));
