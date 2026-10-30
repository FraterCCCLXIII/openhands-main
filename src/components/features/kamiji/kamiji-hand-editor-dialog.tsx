import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import {
  MODAL_MAX_WIDTH_VIEWPORT,
  modalWidthClassName,
} from "#/components/shared/modals/modal-body";
import { cn } from "#/utils/utils";
import { KamijiHandEditor } from "./kamiji-hand-editor";

interface KamijiHandEditorDialogProps {
  onClose: () => void;
}

/** The Hand editor in a modal; load it with `React.lazy` so three.js stays out of the main bundle. */
export default function KamijiHandEditorDialog({
  onClose,
}: KamijiHandEditorDialogProps) {
  const { t } = useTranslation("openhands");
  const title = t(I18nKey.KAMIJI$EDIT_HAND);
  return (
    <ModalBackdrop onClose={onClose} aria-label={title}>
      <div
        data-testid="kamiji-hand-editor-dialog"
        className={cn(
          "flex max-h-screen flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-tertiary p-4 shadow-lg",
          modalWidthClassName("lg"),
          MODAL_MAX_WIDTH_VIEWPORT,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-contrast">{title}</h2>
          <button
            type="button"
            data-testid="kamiji-hand-editor-close"
            aria-label={t(I18nKey.BUTTON$CLOSE)}
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-contrast"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <KamijiHandEditor />
      </div>
    </ModalBackdrop>
  );
}
