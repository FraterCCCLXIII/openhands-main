import type { CSSProperties, ReactNode } from "react";
import { CircleX } from "lucide-react";
import toast, { ToastOptions } from "react-hot-toast";

import { OH_STATUS_ERROR_COLOR } from "@/src/constants/status-colors";
import { cn } from "@/src/lib/utils";
import { calculateToastDuration } from "@/src/utils/toast-duration";

const TOAST_MESSAGE_CLASSNAME =
  "text-sm leading-5 [word-break:break-word] [overflow-wrap:anywhere]";

// react-hot-toast accepts only CSSProperties via the style option — cannot use className
const TOAST_STYLE: CSSProperties = {
  background: "var(--oh-color-tertiary)",
  border: "1px solid var(--oh-border-input)",
  color: "var(--oh-muted)",
  borderRadius: "var(--oh-radius)",
  fontSize: "14px",
  lineHeight: "20px",
  maxWidth: "400px",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
};

export const TOAST_OPTIONS: ToastOptions = {
  position: "top-right",
  style: TOAST_STYLE,
};

const ERROR_TOAST_STYLE: CSSProperties = {
  ...TOAST_STYLE,
  color: "var(--oh-muted)",
};

export function ErrorToastContent({ message }: { message: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <span
        aria-hidden
        className="flex h-5 shrink-0 items-center"
      >
        <CircleX
          className="h-4 w-4"
          strokeWidth={2}
          style={{ color: OH_STATUS_ERROR_COLOR }}
        />
      </span>
      <span className={cn("min-w-0 flex-1", TOAST_MESSAGE_CLASSNAME)}>
        {message}
      </span>
    </div>
  );
}

export const ERROR_TOAST_OPTIONS: ToastOptions = {
  ...TOAST_OPTIONS,
  icon: null,
  style: ERROR_TOAST_STYLE,
};

const DEFAULT_ERROR_MESSAGE = "Something went wrong.";

export const displayErrorToast = (error: string | null | undefined) => {
  const errorMessage = error || DEFAULT_ERROR_MESSAGE;
  const duration = calculateToastDuration(errorMessage, 4000);
  toast(<ErrorToastContent message={errorMessage} />, {
    ...ERROR_TOAST_OPTIONS,
    duration,
  });
};

export const displaySuccessToast = (message: string) => {
  const duration = calculateToastDuration(message, 5000);
  toast.success(
    <span className={TOAST_MESSAGE_CLASSNAME}>{message}</span>,
    { ...TOAST_OPTIONS, duration },
  );
};

export const displayWarningToast = (message: string) => {
  const duration = calculateToastDuration(message, 6000);
  toast(
    <span className={TOAST_MESSAGE_CLASSNAME}>{message}</span>,
    { ...TOAST_OPTIONS, icon: "⚠️", duration },
  );
};

export function reportStatusMessage(message: string | null) {
  if (!message) {
    return;
  }

  const lower = message.toLowerCase();
  const isError =
    lower.includes("failed") ||
    lower.includes("unable") ||
    lower.includes("error");

  if (isError) {
    displayErrorToast(message);
    return;
  }

  displaySuccessToast(message);
}
