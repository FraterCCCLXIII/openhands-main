import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import {
  useBackendIdentityStore,
  type BackendIdentity,
} from "#/stores/backend-identity-store";
import {
  BACKEND_EMOJI_CHOICES,
  BACKEND_ICON_LIBRARY,
} from "./backend-identity-icons";
import { AccountIdentityTile } from "./backend-identity-tile";

/** Uploads are drawn at this size and stored as data URLs in local storage. */
const UPLOAD_EDGE_PX = 128;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

type PickerTab = "emoji" | "icon" | "upload";

const TABS: PickerTab[] = ["emoji", "icon", "upload"];

const TAB_LABEL_KEYS: Record<PickerTab, I18nKey> = {
  emoji: I18nKey.BACKEND_ICON$EMOJI,
  icon: I18nKey.BACKEND_ICON$ICON,
  upload: I18nKey.BACKEND_ICON$UPLOAD,
};

/**
 * Downscales an image to a square data URL. Center-crops so the subject
 * stays in frame and keeps the stored value small.
 */
export function readImageAsIdentityDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = UPLOAD_EDGE_PX;
      canvas.height = UPLOAD_EDGE_PX;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas is unavailable"));
        return;
      }
      const edge = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = (image.naturalWidth - edge) / 2;
      const sy = (image.naturalHeight - edge) / 2;
      context.drawImage(
        image,
        sx,
        sy,
        edge,
        edge,
        0,
        0,
        UPLOAD_EDGE_PX,
        UPLOAD_EDGE_PX,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

export interface BackendIdentityPickerProps {
  /** `getBackendIdentityKey` for the account being edited. */
  identityKey: string;
  fallback: React.ReactNode;
  className?: string;
}

/**
 * Edits the icon for one account: an emoji, an icon from the library, or an
 * uploaded image. Every choice writes the same store entry the sidebar reads,
 * so the change shows up in the header as soon as it is picked.
 */
export function BackendIdentityPicker({
  identityKey,
  fallback,
  className,
}: BackendIdentityPickerProps) {
  const { t } = useTranslation("openhands");
  const identity = useBackendIdentityStore(
    (state) => state.identityByKey[identityKey],
  );
  const setBackendIdentity = useBackendIdentityStore(
    (state) => state.setBackendIdentity,
  );
  const [tab, setTab] = React.useState<PickerTab>(
    identity?.type === "icon"
      ? "icon"
      : identity?.type === "image"
        ? "upload"
        : "emoji",
  );
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const choose = (next: BackendIdentity | null) => {
    setUploadError(null);
    setBackendIdentity(identityKey, next);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > UPLOAD_MAX_BYTES) {
      setUploadError(t(I18nKey.BACKEND_ICON$UPLOAD_ERROR));
      return;
    }
    try {
      const dataUrl = await readImageAsIdentityDataUrl(file);
      choose({ type: "image", dataUrl });
    } catch {
      setUploadError(t(I18nKey.BACKEND_ICON$UPLOAD_ERROR));
    }
  };

  return (
    <div
      data-testid="backend-identity-picker"
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex items-center gap-3">
        <AccountIdentityTile
          identityKey={identityKey}
          fallback={fallback}
          size="lg"
        />
        <button
          type="button"
          onClick={() => choose(null)}
          disabled={!identity}
          className="text-xs text-muted hover:text-contrast disabled:opacity-40"
        >
          {t(I18nKey.BACKEND_ICON$RESET)}
        </button>
      </div>

      <div role="tablist" className="flex gap-1">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs",
              tab === value
                ? "bg-surface-raised text-contrast"
                : "text-muted hover:text-contrast",
            )}
          >
            {t(TAB_LABEL_KEYS[value])}
          </button>
        ))}
      </div>

      {tab === "emoji" ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            inputMode="text"
            maxLength={8}
            placeholder={t(I18nKey.BACKEND_ICON$EMOJI_PLACEHOLDER)}
            aria-label={t(I18nKey.BACKEND_ICON$EMOJI_PLACEHOLDER)}
            onChange={(event) => {
              const value = event.target.value.trim();
              if (value) choose({ type: "emoji", value });
            }}
            className="h-8 w-32 rounded-md bg-surface-raised px-2 text-sm text-contrast"
          />
          <div className="grid grid-cols-10 gap-1">
            {BACKEND_EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={emoji}
                onClick={() => choose({ type: "emoji", value: emoji })}
                className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-surface-raised"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "icon" ? (
        <div className="grid grid-cols-8 gap-1">
          {Object.entries(BACKEND_ICON_LIBRARY).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              onClick={() => choose({ type: "icon", name })}
              className="flex size-8 items-center justify-center rounded-md text-contrast hover:bg-surface-raised"
            >
              <Icon aria-hidden size={18} />
            </button>
          ))}
        </div>
      ) : null}

      {tab === "upload" ? (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            aria-label={t(I18nKey.BACKEND_ICON$UPLOAD)}
            onChange={(event) => {
              const input = event.currentTarget;
              void handleFile(input.files?.[0]);
              input.value = "";
            }}
            className="text-xs text-muted"
          />
          {uploadError ? (
            <p role="alert" className="text-xs text-status-error">
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
