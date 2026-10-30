import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RelayConnection, TeamClient } from "#/chat-transport/nostr";
import {
  accountFromSecret,
  generateAccount,
  secretFromInput,
  type Account,
} from "#/chat-transport/nostr/keys";
import { decodeInvite } from "#/chat-transport/nostr/nip29";
import { I18nKey } from "#/i18n/declaration";
import { useTeamChatStore } from "#/stores/team-chat-store";
import { cn } from "#/utils/utils";
import {
  CopyField,
  ErrorNote,
  inputClassName,
  primaryButtonClassName,
} from "./team-chat-ui";

type GateTab = "create" | "signIn" | "join";
type ChooserMode = "start" | "join";
const CHOOSER_MODES: ChooserMode[] = ["start", "join"];

const TABS: Array<{ id: GateTab; label: I18nKey }> = [
  { id: "create", label: I18nKey.TEAM_CHAT$TAB_CREATE },
  { id: "signIn", label: I18nKey.TEAM_CHAT$TAB_SIGN_IN },
  { id: "join", label: I18nKey.TEAM_CHAT$TAB_JOIN },
];

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "team";
const randomSuffix = () => Math.random().toString(36).slice(2, 8);

/** The form area of the dialog: fields stacked, nothing boxed inside the dialog itself. */
function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-4">{children}</div>;
}

const wideButton = "w-full py-2.5";

/** Icon tile, title and one line on what team chat is, at the top of the dialog. */
function DialogHeading({ title }: { title: string }) {
  const { t } = useTranslation("openhands");
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-surface-raised text-contrast">
        <MessagesSquare size={22} aria-hidden />
      </span>
      <h1 className="text-xl font-semibold text-contrast">{title}</h1>
      <p className="max-w-xs text-sm text-muted">
        {t(I18nKey.TEAM_CHAT$GATE_SUBTITLE)}
      </p>
    </header>
  );
}

/** Tabs drawn as one segmented control. */
function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="grid gap-1 rounded-xl bg-surface p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            value === id
              ? "bg-surface-raised text-contrast shadow-sm"
              : "text-muted hover:text-contrast",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-contrast">
      {label}
      {children}
    </label>
  );
}

function DevKeyNote() {
  const { t } = useTranslation("openhands");
  return (
    <p className="text-xs text-muted">{t(I18nKey.TEAM_CHAT$DEV_KEY_NOTE)}</p>
  );
}

/** Runs an async action, keeping its error for display instead of throwing. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function SaveKeyStep({
  account,
  onContinue,
}: {
  account: Account;
  onContinue: () => void;
}) {
  const { t } = useTranslation("openhands");
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <h2 className="text-lg font-medium text-contrast">
        {t(I18nKey.TEAM_CHAT$SAVE_KEY_TITLE)}
      </h2>
      <p className="text-sm text-muted">{t(I18nKey.TEAM_CHAT$SAVE_KEY_BODY)}</p>
      <CopyField
        secret
        label={t(I18nKey.TEAM_CHAT$SECRET_KEY)}
        value={account.nsec}
      />
      <CopyField label={t(I18nKey.TEAM_CHAT$PUBLIC_KEY)} value={account.npub} />
      <DevKeyNote />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
        />
        {t(I18nKey.TEAM_CHAT$SAVED_CHECKBOX)}
      </label>
      <button
        type="button"
        className={cn(primaryButtonClassName, wideButton)}
        disabled={!saved}
        onClick={onContinue}
      >
        {t(I18nKey.TEAM_CHAT$CONTINUE)}
      </button>
    </Card>
  );
}

function CreateTab({ relayUrl }: { relayUrl: string }) {
  const { t } = useTranslation("openhands");
  const signIn = useTeamChatStore((s) => s.signIn);
  const [name, setName] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  if (account) {
    return (
      <SaveKeyStep
        account={account}
        onContinue={() => signIn(account, relayUrl)}
      />
    );
  }
  return (
    <Card>
      <Labeled label={t(I18nKey.TEAM_CHAT$DISPLAY_NAME)}>
        <input
          className={inputClassName}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Labeled>
      <button
        type="button"
        className={cn(primaryButtonClassName, wideButton)}
        disabled={!name.trim()}
        onClick={() => setAccount(generateAccount(name.trim()))}
      >
        {t(I18nKey.TEAM_CHAT$TAB_CREATE)}
      </button>
    </Card>
  );
}

function SignInTab({
  relayUrl,
  setRelayUrl,
}: {
  relayUrl: string;
  setRelayUrl: (url: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const signIn = useTeamChatStore((s) => s.signIn);
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");
  const { busy, error, run } = useAction();
  const submit = () =>
    run(async () => {
      const account = accountFromSecret(secretFromInput(secret), {
        name: name.trim(),
      });
      // Reaching the relay now turns an unreachable address into a clear error here.
      const conn = new RelayConnection(relayUrl, account.secretKey);
      await conn.connect();
      conn.close();
      signIn(account, relayUrl);
    });
  return (
    <Card>
      <Labeled label={t(I18nKey.TEAM_CHAT$SECRET_KEY_INPUT)}>
        <input
          type="password"
          className={cn(inputClassName, "font-mono")}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
      </Labeled>
      <Labeled label={t(I18nKey.TEAM_CHAT$RELAY_URL)}>
        <input
          className={inputClassName}
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
        />
      </Labeled>
      <Labeled label={t(I18nKey.TEAM_CHAT$DISPLAY_NAME_IF_NEW)}>
        <input
          className={inputClassName}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Labeled>
      <ErrorNote error={error} />
      <button
        type="button"
        className={cn(primaryButtonClassName, wideButton)}
        disabled={busy || !secret.trim()}
        onClick={submit}
      >
        {t(I18nKey.TEAM_CHAT$TAB_SIGN_IN)}
      </button>
      <DevKeyNote />
    </Card>
  );
}

/** Join with an invite: for someone with no account yet (a name is needed) or signed in. */
function JoinFields({
  account,
  onJoined,
}: {
  account: Account | null;
  onJoined: (account: Account, groupId: string, relayUrl: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const [invite, setInvite] = useState("");
  const [name, setName] = useState("");
  const { busy, error, run } = useAction();
  const submit = () =>
    run(async () => {
      const who = account ?? generateAccount(name.trim());
      const client = await TeamClient.join(invite.trim(), who);
      client.close();
      const { relayUrl, group } = decodeInvite(invite.trim());
      onJoined(who, group, relayUrl);
    });
  return (
    <Card>
      <Labeled label={t(I18nKey.TEAM_CHAT$INVITE)}>
        <input
          className={cn(inputClassName, "font-mono text-xs")}
          placeholder={t(I18nKey.TEAM_CHAT$INVITE_PLACEHOLDER)}
          value={invite}
          onChange={(e) => setInvite(e.target.value)}
        />
      </Labeled>
      {!account && (
        <Labeled label={t(I18nKey.TEAM_CHAT$DISPLAY_NAME)}>
          <input
            className={inputClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Labeled>
      )}
      <ErrorNote error={error} />
      <button
        type="button"
        className={cn(primaryButtonClassName, wideButton)}
        disabled={busy || !invite.trim() || (!account && !name.trim())}
        onClick={submit}
      >
        {t(busy ? I18nKey.TEAM_CHAT$WORKING : I18nKey.TEAM_CHAT$JOIN_BUTTON)}
      </button>
    </Card>
  );
}

function JoinTab() {
  const signIn = useTeamChatStore((s) => s.signIn);
  const [pending, setPending] = useState<{
    account: Account;
    relayUrl: string;
    groupId: string;
  } | null>(null);
  if (pending) {
    return (
      <SaveKeyStep
        account={pending.account}
        onContinue={() => {
          signIn(pending.account, pending.relayUrl);
          useTeamChatStore.getState().openTeam(pending.groupId);
        }}
      />
    );
  }
  return (
    <JoinFields
      account={null}
      onJoined={(account, groupId, relayUrl) =>
        setPending({ account, groupId, relayUrl })
      }
    />
  );
}

/** Signed in, no team yet: start one or join one with an invite. */
export function TeamChooser({ account }: { account: Account }) {
  const { t } = useTranslation("openhands");
  const relayUrl = useTeamChatStore((s) => s.relayUrl);
  const openTeam = useTeamChatStore((s) => s.openTeam);
  const [mode, setMode] = useState<ChooserMode>("start");
  const [teamName, setTeamName] = useState("");
  const { busy, error, run } = useAction();
  const start = () =>
    run(async () => {
      const groupId = `${slug(teamName)}-${randomSuffix()}`;
      const client = await TeamClient.create({
        relayUrl,
        groupId,
        account,
        name: teamName.trim(),
      });
      client.close();
      openTeam(groupId);
    });
  return (
    <div data-testid="team-chooser" className="flex flex-col gap-5 p-6 pt-8">
      <DialogHeading title={t(I18nKey.TEAM_CHAT$CHOOSE_TITLE)} />
      <SegmentedTabs
        tabs={CHOOSER_MODES.map((id) => ({
          id,
          label: t(
            id === "start"
              ? I18nKey.TEAM_CHAT$START_TEAM
              : I18nKey.TEAM_CHAT$TAB_JOIN,
          ),
        }))}
        value={mode}
        onChange={setMode}
      />
      {mode === "start" ? (
        <Card>
          <Labeled label={t(I18nKey.TEAM_CHAT$TEAM_NAME)}>
            <input
              className={inputClassName}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </Labeled>
          <ErrorNote error={error} />
          <button
            type="button"
            className={cn(primaryButtonClassName, wideButton)}
            disabled={busy || !teamName.trim()}
            onClick={start}
          >
            {t(
              busy ? I18nKey.TEAM_CHAT$WORKING : I18nKey.TEAM_CHAT$START_BUTTON,
            )}
          </button>
        </Card>
      ) : (
        <JoinFields
          account={account}
          onJoined={(_a, groupId) => openTeam(groupId)}
        />
      )}
    </div>
  );
}

/** The signed-out screen: create an account, sign in with a key, or join with an invite. */
export function TeamChatGate() {
  const { t } = useTranslation("openhands");
  const relayUrl = useTeamChatStore((s) => s.relayUrl);
  const [tab, setTab] = useState<GateTab>("create");
  const [relay, setRelay] = useState(relayUrl);
  return (
    <div data-testid="team-chat-gate" className="flex flex-col gap-5 p-6 pt-8">
      <DialogHeading title={t(I18nKey.TEAM_CHAT$TITLE)} />
      <SegmentedTabs
        tabs={TABS.map(({ id, label }) => ({ id, label: t(label) }))}
        value={tab}
        onChange={setTab}
      />
      {tab === "create" && <CreateTab relayUrl={relay} />}
      {tab === "signIn" && (
        <SignInTab relayUrl={relay} setRelayUrl={setRelay} />
      )}
      {tab === "join" && <JoinTab />}
    </div>
  );
}
