import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useBackendIdentityStore } from "#/stores/backend-identity-store";
import {
  readImageAsIdentityDataUrl,
  UPLOAD_MAX_BYTES,
} from "./backend-identity-picker";
import {
  BackendIdentityTile,
  type BackendIdentityTileSize,
} from "./backend-identity-tile";

export interface EditableAccountIdentityTileProps {
  /** `getBackendIdentityKey` for the account this tile belongs to. */
  identityKey: string;
  /** Icon drawn when the account has not picked one. */
  fallback: React.ReactNode;
  size?: BackendIdentityTileSize;
}

/**
 * An account tile that reveals a plus button on hover. Picking a file replaces
 * the account's image, using the same store entry as the settings picker.
 */
export function EditableAccountIdentityTile({
  identityKey,
  fallback,
  size,
}: EditableAccountIdentityTileProps) {
  const { t } = useTranslation("openhands");
  const identity = useBackendIdentityStore(
    (state) => state.identityByKey[identityKey],
  );
  const background = useBackendIdentityStore(
    (state) => state.backgroundByKey[identityKey],
  );
  const setBackendIdentity = useBackendIdentityStore(
    (state) => state.setBackendIdentity,
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file?.type.startsWith("image/")) return;
    if (file.size > UPLOAD_MAX_BYTES) return;
    try {
      const dataUrl = await readImageAsIdentityDataUrl(file);
      setBackendIdentity(identityKey, { type: "image", dataUrl });
    } catch {
      // Unreadable files leave the current icon in place.
    }
  };

  return (
    <span className="group relative inline-flex shrink-0">
      <BackendIdentityTile
        identity={identity}
        fallback={fallback}
        size={size}
        background={background}
      />
      <button
        type="button"
        aria-label={t(I18nKey.BACKEND_ICON$UPLOAD)}
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Plus aria-hidden className="size-3.5 text-white" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </span>
  );
}
