import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useBackendIdentityStore } from "#/stores/backend-identity-store";
import { BackendIdentityPicker } from "./backend-identity-picker";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import {
  MODAL_MAX_WIDTH_VIEWPORT,
  modalWidthClassName,
} from "#/components/shared/modals/modal-body";
import { ModalCloseButton } from "#/components/shared/modals/modal-close-button";
import { cn } from "#/utils/utils";
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
 * An account tile that reveals a plus button when the tile itself is hovered
 * (a named group, so hovering the surrounding row or dropdown does not).
 * Clicking it opens a modal with the same picker the settings page uses.
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
  const [open, setOpen] = React.useState(false);

  return (
    <span className="group/tile relative inline-flex shrink-0">
      <BackendIdentityTile
        identity={identity}
        fallback={fallback}
        size={size}
        background={background}
      />
      <button
        type="button"
        data-testid="backend-icon-edit-button"
        aria-label={t(I18nKey.BACKEND_ICON$TITLE)}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/tile:opacity-100"
      >
        <Plus aria-hidden className="size-3.5 text-white" />
      </button>
      {open ? (
        <ModalBackdrop
          onClose={() => setOpen(false)}
          aria-label={t(I18nKey.BACKEND_ICON$TITLE)}
        >
          <div
            data-testid="backend-icon-modal"
            className={cn(
              "relative max-h-[92dvh] overflow-y-auto rounded-3xl border border-border bg-base-secondary p-6 flex flex-col gap-4",
              modalWidthClassName("md"),
              MODAL_MAX_WIDTH_VIEWPORT,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <ModalCloseButton
              onClose={() => setOpen(false)}
              testId="backend-icon-modal-close"
            />
            <div className="flex flex-col gap-1 pr-6">
              <h2 className="text-base font-medium text-contrast">
                {t(I18nKey.BACKEND_ICON$TITLE)}
              </h2>
              <p className="text-xs text-muted">
                {t(I18nKey.BACKEND_ICON$DESCRIPTION)}
              </p>
            </div>
            <BackendIdentityPicker
              identityKey={identityKey}
              fallback={fallback}
            />
          </div>
        </ModalBackdrop>
      ) : null}
    </span>
  );
}
