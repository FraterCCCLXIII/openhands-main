import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Pencil, Trash2 } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { useCreateSecret } from "#/hooks/mutation/use-create-secret";
import { useDeleteSecret } from "#/hooks/mutation/use-delete-secret";
import { useUpdateSecret } from "#/hooks/mutation/use-update-secret";
import { useSearchSecrets } from "#/hooks/query/use-get-secrets";
import { I18nKey } from "#/i18n/declaration";
import {
  buildFactorySecretName,
  factorySecretPrefix,
  isFactoryScopedSecretName,
  maxFactorySecretEntryLength,
  parseFactorySecretName,
} from "#/utils/factory-secrets";
import {
  formControlSettingsFieldClassName,
  formControlButtonClassName,
} from "#/utils/form-control-classes";
import { cn } from "#/utils/utils";
import {
  automationActivityListClassName,
  automationActivityRowClassName,
} from "../automation-view-mode";
import { DeleteConfirmationModal } from "../delete-confirmation-modal";

type VaultForm =
  | { mode: "add" }
  | { mode: "replace"; secretName: string; entryName: string };

/**
 * Write-only inputs for the vault form. The value lives only in this
 * component's state while typing and is cleared when the form closes.
 */
function VaultEntryForm({
  factoryId,
  form,
  existingNames,
  onClose,
}: {
  factoryId: string;
  form: VaultForm;
  existingNames: string[];
  onClose: () => void;
}) {
  const { t } = useTranslation("openhands");
  const queryClient = useQueryClient();
  const { mutate: createSecret, isPending: isCreating } = useCreateSecret();
  const { mutate: updateSecret, isPending: isUpdating } = useUpdateSecret();
  const [entryName, setEntryName] = useState(
    form.mode === "replace" ? form.entryName : "",
  );
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSaving = isCreating || isUpdating;

  const finish = () => {
    setValue("");
    queryClient.invalidateQueries({ queryKey: ["secrets"] });
    queryClient.invalidateQueries({ queryKey: ["secrets-search"] });
    onClose();
  };
  // The server error is never shown: it could echo request details.
  const fail = () => {
    setValue("");
    setError(t(I18nKey.FACTORY$VAULT_SAVE_ERROR));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setError(t(I18nKey.SECRETS$SECRET_VALUE_REQUIRED));
      return;
    }
    const callbacks = { onSuccess: finish, onError: fail };
    if (form.mode === "replace") {
      updateSecret(
        {
          secretToEdit: form.secretName,
          name: form.secretName,
          description: description.trim() || undefined,
          value: trimmedValue,
        },
        callbacks,
      );
      return;
    }
    const secretName = buildFactorySecretName(factoryId, entryName);
    if (!secretName) {
      setError(
        t(I18nKey.FACTORY$VAULT_NAME_INVALID, {
          max: maxFactorySecretEntryLength(factoryId),
        }),
      );
      return;
    }
    if (existingNames.includes(secretName)) {
      setError(t(I18nKey.SECRETS$SECRET_ALREADY_EXISTS));
      return;
    }
    createSecret(
      {
        name: secretName,
        value: trimmedValue,
        description: description.trim() || undefined,
      },
      callbacks,
    );
  };

  return (
    <form
      data-testid="factory-vault-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border p-3"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        {t(I18nKey.SETTINGS$NAME)}
        <input
          data-testid="factory-vault-name"
          type="text"
          autoComplete="off"
          readOnly={form.mode === "replace"}
          value={entryName}
          onChange={(event) => setEntryName(event.currentTarget.value)}
          className={formControlSettingsFieldClassName}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {form.mode === "replace"
          ? t(I18nKey.FACTORY$VAULT_NEW_VALUE)
          : t(I18nKey.FORM$VALUE)}
        <span className="flex items-center gap-2">
          <input
            data-testid="factory-vault-value"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            className={cn(formControlSettingsFieldClassName, "min-w-0 flex-1")}
          />
          <button
            type="button"
            data-testid="factory-vault-reveal"
            aria-pressed={reveal}
            aria-label={
              reveal
                ? t(I18nKey.FACTORY$VAULT_HIDE_VALUE)
                : t(I18nKey.FACTORY$VAULT_SHOW_VALUE)
            }
            onClick={() => setReveal((current) => !current)}
            className={cn(formControlButtonClassName, "px-2")}
          >
            {reveal ? (
              <EyeOff size={16} aria-hidden />
            ) : (
              <Eye size={16} aria-hidden />
            )}
          </button>
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t(I18nKey.FORM$DESCRIPTION)}
        <input
          data-testid="factory-vault-description"
          type="text"
          autoComplete="off"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          className={formControlSettingsFieldClassName}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <BrandButton
          type="submit"
          variant="primary"
          testId="factory-vault-submit"
          isDisabled={isSaving}
        >
          {form.mode === "replace"
            ? t(I18nKey.SECRETS$EDIT_SECRET)
            : t(I18nKey.SECRETS$ADD_SECRET)}
        </BrandButton>
        <BrandButton
          type="button"
          variant="secondary"
          testId="factory-vault-cancel"
          isDisabled={isSaving}
          onClick={() => {
            setValue("");
            onClose();
          }}
        >
          {t(I18nKey.BUTTON$CANCEL)}
        </BrandButton>
      </div>
    </form>
  );
}

/**
 * A write-only vault for a factory's agents, on the shared secret store.
 * Entries are scoped by a name prefix (see `#/utils/factory-secrets`); the
 * store reports names and descriptions only, so values and last digits are
 * never available to show.
 */
export function FactoryVault({ factoryId }: { factoryId: string }) {
  const { t } = useTranslation("openhands");
  const queryClient = useQueryClient();
  const { data: secrets, isLoading, isError } = useSearchSecrets();
  const { mutate: deleteSecret, isPending: isDeleting } = useDeleteSecret();
  const [form, setForm] = useState<VaultForm | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const prefix = factorySecretPrefix(factoryId) ?? "";
  const own = secrets.flatMap((secret) => {
    const entryName = parseFactorySecretName(factoryId, secret.name);
    return entryName ? [{ ...secret, entryName }] : [];
  });
  const shared = secrets.filter(
    (secret) => !isFactoryScopedSecretName(secret.name),
  );
  const pendingEntry = own.find((entry) => entry.name === pendingDelete);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteSecret(pendingDelete, {
      onSuccess: () => {
        setPendingDelete(null);
        setDeleteFailed(false);
        queryClient.invalidateQueries({ queryKey: ["secrets"] });
        queryClient.invalidateQueries({ queryKey: ["secrets-search"] });
      },
      onError: () => {
        setPendingDelete(null);
        setDeleteFailed(true);
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p data-testid="factory-vault-hint" className="text-sm text-muted">
        {t(I18nKey.FACTORY$VAULT_HINT, { prefix })}
      </p>
      {form ? null : (
        <BrandButton
          type="button"
          variant="primary"
          testId="factory-vault-add"
          className="self-start"
          onClick={() => setForm({ mode: "add" })}
        >
          {t(I18nKey.SECRETS$ADD_SECRET)}
        </BrandButton>
      )}
      {form ? (
        <VaultEntryForm
          factoryId={factoryId}
          form={form}
          existingNames={secrets.map((secret) => secret.name)}
          onClose={() => setForm(null)}
        />
      ) : null}
      {isError || deleteFailed ? (
        <p role="alert" className="text-sm text-danger">
          {isError
            ? t(I18nKey.FACTORY$VAULT_LOAD_ERROR)
            : t(I18nKey.FACTORY$VAULT_SAVE_ERROR)}
        </p>
      ) : null}
      {!isLoading && own.length === 0 ? (
        <p data-testid="factory-vault-empty" className="text-sm text-muted">
          {t(I18nKey.FACTORY$VAULT_EMPTY)}
        </p>
      ) : (
        <ul className={automationActivityListClassName}>
          {own.map((entry) => (
            <li
              key={entry.name}
              data-testid="factory-vault-entry"
              className={cn(
                automationActivityRowClassName,
                "items-center gap-3 px-3 py-2.5",
              )}
            >
              <KeyRound size={16} aria-hidden className="shrink-0 text-muted" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {entry.entryName}
                </span>
                {entry.description ? (
                  <span className="truncate text-xs text-muted">
                    {entry.description}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {t(I18nKey.FACTORY$VAULT_STORED)}
              </span>
              <button
                type="button"
                data-testid="factory-vault-replace"
                aria-label={t(I18nKey.FACTORY$VAULT_REPLACE_ENTRY, {
                  name: entry.entryName,
                })}
                onClick={() =>
                  setForm({
                    mode: "replace",
                    secretName: entry.name,
                    entryName: entry.entryName,
                  })
                }
                className="text-muted hover:text-contrast"
              >
                <Pencil size={16} aria-hidden />
              </button>
              <button
                type="button"
                data-testid="factory-vault-delete"
                aria-label={t(I18nKey.FACTORY$VAULT_DELETE_ENTRY, {
                  name: entry.entryName,
                })}
                onClick={() => setPendingDelete(entry.name)}
                className="text-muted hover:text-danger"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {shared.length > 0 ? (
        <section data-testid="factory-vault-shared" className="mt-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t(I18nKey.FACTORY$VAULT_SHARED_TITLE)}
          </h3>
          <p className="mb-2 text-xs text-muted">
            {t(I18nKey.FACTORY$VAULT_SHARED_HINT)}
          </p>
          <ul className={automationActivityListClassName}>
            {shared.map((secret) => (
              <li
                key={secret.name}
                data-testid="factory-vault-shared-entry"
                className={cn(
                  automationActivityRowClassName,
                  "items-center gap-3 px-3 py-2",
                )}
              >
                <KeyRound
                  size={14}
                  aria-hidden
                  className="shrink-0 text-muted"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {secret.name}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {t(I18nKey.FACTORY$VAULT_STORED)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <DeleteConfirmationModal
        isOpen={pendingEntry !== undefined}
        automationName={pendingEntry?.entryName ?? ""}
        title={t(I18nKey.BUTTON$DELETE)}
        message={t(I18nKey.SECRETS$CONFIRM_DELETE_KEY)}
        confirmLabel={t(I18nKey.BUTTON$DELETE)}
        confirmTestId="factory-vault-confirm-delete"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
