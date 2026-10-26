/* eslint-disable i18next/no-literal-string -- dev-only style sheet, not product copy */
import { Navigate } from "react-router";
import {
  KAMIJI_LOOK_KEYS,
  getKamijiLook,
  type KamijiLookKey,
} from "#/components/features/kamiji/kamiji-look";
import {
  KamijiLookAvatar,
  KamijiLookBadge,
} from "#/components/features/kamiji/kamiji-look-avatar";

const GROUPS: Array<{ prefix: string; title: string; where: string }> = [
  {
    prefix: "status",
    title: "Conversation status",
    where: "Feed card header avatar",
  },
  {
    prefix: "notification",
    title: "Notifications tab",
    where: "Notification card avatar and the tab badge (most urgent kind)",
  },
  {
    prefix: "update",
    title: "Feed card updates",
    where: "Agent comments, tool calls and errors inside a card",
  },
  {
    prefix: "toast",
    title: "Toasts",
    where: "Error and warning deck (success is mapped but not wired)",
  },
  {
    prefix: "ref",
    title: "Card references",
    where: "PR and ticket bubbles, branch and worktree chips, subagents row",
  },
  {
    prefix: "git",
    title: "Git events",
    where: "Mapped for PR, merge and CI events; no feed data carries them yet",
  },
  {
    prefix: "tab",
    title: "Feed tabs",
    where: "Feed tab (notifications tab uses the notification looks)",
  },
];

function LookRow({ lookKey }: { lookKey: KamijiLookKey }) {
  const look = getKamijiLook(lookKey);
  return (
    <li
      data-testid="kamiji-look-row"
      data-look={lookKey}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-3"
    >
      <KamijiLookAvatar look={lookKey} size={56} color="#ff9f43" />
      <KamijiLookAvatar look={lookKey} size={24} showProp={false} />
      {look.prop ? (
        <KamijiLookBadge look={lookKey} size={28} />
      ) : (
        <span className="size-7" />
      )}
      <div className="min-w-0 flex-1 text-xs">
        <p className="text-sm font-semibold text-contrast">{lookKey}</p>
        <p className="text-muted">
          {look.expression} · {look.pose ?? look.animation}
          {look.prop ? ` · ${look.prop}` : " · no prop"}
        </p>
      </div>
      <span
        className="size-4 shrink-0 rounded-full border border-border"
        title={look.tint}
        ref={(el) => el?.style.setProperty("background-color", look.tint)}
      />
      <span
        title="2D fallback"
        className="w-7 shrink-0 text-center text-xl leading-none"
      >
        {look.emoji ?? "–"}
      </span>
    </li>
  );
}

export default function MockKamijiLooks() {
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="h-full overflow-y-auto bg-canvas-base text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <header>
          <h1 className="text-xl font-semibold">Kamiji looks</h1>
          <p className="text-sm text-muted">
            Every feed item, notification and git event with its Kamiji: 56px
            avatar with prop, 24px avatar, prop badge, tint and the 2D emoji
            used when WebGL is unavailable.
          </p>
        </header>
        {GROUPS.map(({ prefix, title, where }) => (
          <section key={prefix} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-muted">{where}</p>
            <ul className="flex flex-col gap-2">
              {KAMIJI_LOOK_KEYS.filter((key) =>
                key.startsWith(`${prefix}:`),
              ).map((key) => (
                <LookRow key={key} lookKey={key} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
