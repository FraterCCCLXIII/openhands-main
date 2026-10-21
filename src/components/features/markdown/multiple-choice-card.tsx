import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useSendMessage } from "#/hooks/use-send-message";
import { createChatMessage } from "#/services/chat-service";
import { BrandButton } from "#/components/features/settings/brand-button";
import type { ChoiceTemplate } from "#/utils/choice-template";

const OTHER_OPTION = "other";

type Selection = number | typeof OTHER_OPTION | null;

type Answer = { kind: "answer"; text: string } | { kind: "skip" };

interface MultipleChoiceCardProps {
  template: ChoiceTemplate;
}

export function MultipleChoiceCard({ template }: MultipleChoiceCardProps) {
  const { t } = useTranslation("openhands");
  const { send } = useSendMessage();
  const groupName = React.useId();
  const [selection, setSelection] = React.useState<Selection>(null);
  const [otherText, setOtherText] = React.useState("");
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const [isSending, setIsSending] = React.useState(false);

  const isAnswered = answer !== null;
  const trimmedOther = otherText.trim();
  const selectedText =
    selection === OTHER_OPTION
      ? trimmedOther
      : selection !== null
        ? template.options[selection].label
        : "";
  const canSubmit = selectedText.length > 0 && !isAnswered && !isSending;

  const deliver = async (text: string, result: Answer) => {
    setIsSending(true);
    try {
      await send(createChatMessage(text, [], [], new Date().toISOString()));
      setAnswer(result);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    deliver(selectedText, { kind: "answer", text: selectedText }).catch(
      () => {},
    );
  };

  const handleSkip = () => {
    if (isAnswered || isSending) return;
    deliver(t(I18nKey.CHOICE$SKIP_MESSAGE), { kind: "skip" }).catch(() => {});
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    // Keydown only adds the Cmd/Ctrl+Enter shortcut; controls stay native.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      className="my-2 flex flex-col gap-3 rounded-lg border border-surface-raised bg-surface-raised p-4"
      data-testid="multiple-choice-card"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      onKeyDown={handleKeyDown}
    >
      <fieldset
        disabled={isAnswered}
        className="flex min-w-0 flex-col gap-2 border-0 p-0"
      >
        <legend className="mb-2 text-sm font-medium text-contrast">
          {template.question}
        </legend>
        {template.options.map((option, index) => (
          <label
            key={option.label}
            className="flex cursor-pointer items-start gap-2 text-sm text-contrast"
          >
            <input
              type="radio"
              name={groupName}
              className="mt-1"
              checked={selection === index}
              onChange={() => setSelection(index)}
            />
            <span className="flex flex-col">
              <span>{option.label}</span>
              {option.description && (
                <span className="text-xs text-text-tertiary">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
        {template.allowOther && (
          <div className="flex items-start gap-2 text-sm text-contrast">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name={groupName}
                checked={selection === OTHER_OPTION}
                onChange={() => setSelection(OTHER_OPTION)}
              />
              <span>{t(I18nKey.CHOICE$OTHER)}</span>
            </label>
            <input
              type="text"
              aria-label={t(I18nKey.CHOICE$OTHER)}
              placeholder={t(I18nKey.CHOICE$OTHER_PLACEHOLDER)}
              className="min-w-0 flex-1 rounded border border-surface-raised bg-transparent px-2 py-1"
              value={otherText}
              onFocus={() => setSelection(OTHER_OPTION)}
              onChange={(event) => {
                setOtherText(event.target.value);
                setSelection(OTHER_OPTION);
              }}
            />
          </div>
        )}
      </fieldset>
      {isAnswered ? (
        <p className="text-xs text-text-tertiary" role="status">
          {answer.kind === "skip"
            ? t(I18nKey.CHOICE$SKIPPED)
            : t(I18nKey.CHOICE$ANSWERED, { answer: answer.text })}
        </p>
      ) : (
        <div className="flex justify-end gap-2">
          <BrandButton
            type="button"
            variant="secondary"
            isDisabled={isSending}
            onClick={handleSkip}
          >
            {t(I18nKey.CHOICE$SKIP)}
          </BrandButton>
          <BrandButton type="submit" variant="primary" isDisabled={!canSubmit}>
            {t(I18nKey.CHOICE$SUBMIT)}
          </BrandButton>
        </div>
      )}
    </form>
  );
}
