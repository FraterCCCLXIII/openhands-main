import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { DEFAULT_SPRINT_LENGTH_DAYS } from "#/planning/constants";
import { addDays, todayIso } from "#/planning/dates";
import { usePlanningStore } from "#/stores/planning-store";

interface CreateFormProps {
  onDone: (createdTicketId?: string) => void;
}

const INPUT_CLASS =
  "rounded border border-border bg-surface px-2 py-1 text-sm text-content";
const FORM_CLASS =
  "flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface-raised p-3";

function FormActions({ onCancel }: { onCancel: () => void }) {
  const { t } = useTranslation("openhands");
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        className="rounded bg-primary px-3 py-1 text-sm text-on-primary"
      >
        {t(I18nKey.BUTTON$CREATE)}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded px-3 py-1 text-sm text-muted hover:bg-interactive-hover"
      >
        {t(I18nKey.BUTTON$CANCEL)}
      </button>
    </div>
  );
}

export function CreateTicketForm({ onDone }: CreateFormProps) {
  const { t } = useTranslation("openhands");
  const createTicket = usePlanningStore((state) => state.createTicket);
  const [title, setTitle] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onDone(createTicket({ title: trimmed }).id);
  };

  return (
    <form onSubmit={handleSubmit} className={FORM_CLASS}>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t(I18nKey.PLANNING$TICKET_TITLE)}
        <input
          className={INPUT_CLASS}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <FormActions onCancel={() => onDone()} />
    </form>
  );
}

export function CreateSprintForm({ onDone }: CreateFormProps) {
  const { t } = useTranslation("openhands");
  const createSprint = usePlanningStore((state) => state.createSprint);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(
    addDays(todayIso(), DEFAULT_SPRINT_LENGTH_DAYS - 1),
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !startDate || !endDate || endDate < startDate) return;
    createSprint({ name: trimmed, goal: goal.trim(), startDate, endDate });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className={FORM_CLASS}>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t(I18nKey.SETTINGS$NAME)}
        <input
          className={INPUT_CLASS}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t(I18nKey.PLANNING$START_DATE)}
        <input
          type="date"
          className={INPUT_CLASS}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t(I18nKey.PLANNING$END_DATE)}
        <input
          type="date"
          className={INPUT_CLASS}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t(I18nKey.PLANNING$SPRINT_GOAL)}
        <input
          className={INPUT_CLASS}
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
      </label>
      <FormActions onCancel={() => onDone()} />
    </form>
  );
}
