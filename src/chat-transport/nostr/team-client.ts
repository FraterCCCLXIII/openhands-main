import { signEvent, tagValue, tagValues, type NostrEvent } from "./event";
import {
  accountFromSecret,
  generateAccount,
  npubOf,
  pubkeyFromInput,
  type Account,
} from "./keys";
import {
  KIND,
  chatMessage,
  createGroup,
  createInvite,
  decodeInvite,
  encodeInvite,
  joinRequest,
  profile,
  putUser,
  removeUser,
} from "./nip29";
import { RelayConnection } from "./relay";

export interface TeamMember {
  pubkey: string;
  npub: string;
  name: string;
  roles: string[];
  kind: "person" | "agent";
  /** For an agent, the person who runs it. */
  owner?: string;
}

export interface TeamMessage {
  id: string;
  pubkey: string;
  createdAt: number;
  text: string;
  parent: string | null;
  mentions: string[];
}

type Listener = () => void;
type SocketFactory = ConstructorParameters<typeof RelayConnection>[2];

const randomCode = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) =>
    b.toString(36).padStart(2, "0"),
  )
    .join("")
    .slice(0, 12);

export interface TeamClientOptions {
  relayUrl: string;
  groupId: string;
  account: Account;
  /** Tests inject a socket factory; the browser uses its own WebSocket. */
  makeSocket?: SocketFactory;
}

/**
 * A person's view of one team (a NIP-29 group on a relay): members, messages, posting,
 * adding people and agents. Each identity that posts (the person, and each agent they run)
 * has its own signed-in connection, so every message carries its true author.
 */
export class TeamClient {
  readonly account: Account;

  readonly relayUrl: string;

  readonly groupId: string;

  private readonly makeSocket?: SocketFactory;

  private connections = new Map<string, RelayConnection>();

  private profiles = new Map<
    string,
    { name: string; bot: boolean; owner?: string; at: number }
  >();

  private memberRows = new Map<string, string[]>();

  private groupName = "";

  private messageMap = new Map<string, TeamMessage>();

  private listeners = new Set<Listener>();

  private unsubs: Array<() => void> = [];

  private agents = new Map<string, Account>();

  constructor(opts: TeamClientOptions) {
    this.account = opts.account;
    this.relayUrl = opts.relayUrl;
    this.groupId = opts.groupId;
    this.makeSocket = opts.makeSocket;
  }

  // ── Opening a team ──

  /** Starts a new team: this person creates the group and is its admin. */
  static async create(
    opts: TeamClientOptions & { name: string },
  ): Promise<TeamClient> {
    const client = new TeamClient(opts);
    const conn = await client.connection(opts.account);
    await client.publishProfile(opts.account);
    const res = await conn.publish(
      signEvent(createGroup(opts.groupId, opts.name), opts.account.secretKey),
    );
    if (!res.ok) {
      throw new Error(res.message || "The relay would not create the team.");
    }
    await client.start();
    return client;
  }

  /** Opens a team this person already belongs to. */
  static async open(opts: TeamClientOptions): Promise<TeamClient> {
    const client = new TeamClient(opts);
    await client.connection(opts.account);
    await client.publishProfile(opts.account);
    await client.start();
    return client;
  }

  /** Joins a team with an invite string made by an admin. */
  static async join(
    invite: string,
    account: Account,
    makeSocket?: SocketFactory,
  ): Promise<TeamClient> {
    const { relayUrl, group, code } = decodeInvite(invite);
    const client = new TeamClient({
      relayUrl,
      groupId: group,
      account,
      makeSocket,
    });
    const conn = await client.connection(account);
    await client.publishProfile(account);
    const res = await conn.publish(
      signEvent(joinRequest(group, code), account.secretKey),
    );
    if (!res.ok) {
      throw new Error(res.message || "The relay did not accept the invite.");
    }
    await client.start();
    return client;
  }

  private async connection(account: Account): Promise<RelayConnection> {
    const existing = this.connections.get(account.pubkey);
    if (existing) return existing;
    const conn = new RelayConnection(
      this.relayUrl,
      account.secretKey,
      this.makeSocket,
    );
    await conn.connect();
    this.connections.set(account.pubkey, conn);
    return conn;
  }

  private async publishProfile(account: Account) {
    const conn = await this.connection(account);
    await conn.publish(
      signEvent(
        profile({
          name: account.name || npubOf(account.pubkey).slice(0, 12),
          bot: account.kind === "agent",
          owner: account.ownerPubkey,
        }),
        account.secretKey,
      ),
    );
  }

  private async start() {
    const conn = await this.connection(this.account);
    this.unsubs.push(
      conn.subscribe([{ kinds: [KIND.chat], "#h": [this.groupId] }], (e) =>
        this.onChat(e),
      ),
      conn.subscribe(
        [
          {
            kinds: [KIND.groupMetadata, KIND.groupMembers],
            "#d": [this.groupId],
          },
        ],
        (e) => this.onGroupState(e),
      ),
      conn.subscribe([{ kinds: [KIND.profile] }], (e) => this.onProfile(e)),
    );
    await new Promise((r) => {
      setTimeout(r, 250);
    });
  }

  // ── Incoming events ──

  private onChat(e: NostrEvent) {
    if (this.messageMap.has(e.id)) return;
    this.messageMap.set(e.id, {
      id: e.id,
      pubkey: e.pubkey,
      createdAt: e.created_at,
      text: e.content,
      parent: e.tags.find((t) => t[0] === "e" && t[3] === "reply")?.[1] ?? null,
      mentions: tagValues(e, "p"),
    });
    this.emit();
  }

  private onGroupState(e: NostrEvent) {
    if (e.kind === KIND.groupMetadata) {
      this.groupName = tagValue(e, "name") ?? this.groupName;
    }
    if (e.kind === KIND.groupMembers) {
      this.memberRows = new Map(
        e.tags.filter((t) => t[0] === "p").map((t) => [t[1], t.slice(2)]),
      );
    }
    this.emit();
  }

  private onProfile(e: NostrEvent) {
    const known = this.profiles.get(e.pubkey);
    if (known && known.at >= e.created_at) return;
    try {
      const body = JSON.parse(e.content) as {
        name?: string;
        bot?: boolean;
        owner?: string;
      };
      this.profiles.set(e.pubkey, {
        name: body.name ?? "",
        bot: Boolean(body.bot),
        owner: body.owner,
        at: e.created_at,
      });
      this.emit();
    } catch {
      /* ignore a malformed profile */
    }
  }

  // ── Reading ──

  get name(): string {
    return this.groupName || this.groupId;
  }

  members(): TeamMember[] {
    return [...this.memberRows.entries()].map(([pubkey, roles]) => {
      const p = this.profiles.get(pubkey);
      return {
        pubkey,
        npub: npubOf(pubkey),
        name: p?.name || `${npubOf(pubkey).slice(0, 12)}…`,
        roles,
        kind: p?.bot ? "agent" : "person",
        owner: p?.owner,
      };
    });
  }

  isAdmin(pubkey = this.account.pubkey): boolean {
    return this.memberRows.get(pubkey)?.includes("admin") ?? false;
  }

  messages(): TeamMessage[] {
    return [...this.messageMap.values()].sort(
      (a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id),
    );
  }

  nameOf(pubkey: string): string {
    return (
      this.members().find((m) => m.pubkey === pubkey)?.name ??
      this.profiles.get(pubkey)?.name ??
      `${npubOf(pubkey).slice(0, 12)}…`
    );
  }

  myAgents(): Account[] {
    return [...this.agents.values()];
  }

  onChange(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  // ── Writing ──

  /** Posts to the team as this person, or as one of their agents. */
  async post(
    text: string,
    opts: { parent?: string | null; mentions?: string[]; as?: Account } = {},
  ): Promise<void> {
    const author = opts.as ?? this.account;
    const conn = await this.connection(author);
    const res = await conn.publish(
      signEvent(
        chatMessage(this.groupId, text, {
          parent: opts.parent,
          mentions: opts.mentions,
        }),
        author.secretKey,
      ),
    );
    if (!res.ok) {
      throw new Error(res.message || "The relay did not accept the message.");
    }
  }

  /** Admin only: adds a person (or agent) by their public key. */
  async addMember(
    npubOrHex: string,
    roles: string[] = ["member"],
  ): Promise<string> {
    const pubkey = pubkeyFromInput(npubOrHex);
    const conn = await this.connection(this.account);
    const res = await conn.publish(
      signEvent(putUser(this.groupId, pubkey, roles), this.account.secretKey),
    );
    if (!res.ok) {
      throw new Error(res.message || "The relay would not add that member.");
    }
    return pubkey;
  }

  async removeMember(pubkey: string): Promise<void> {
    const conn = await this.connection(this.account);
    const res = await conn.publish(
      signEvent(removeUser(this.groupId, pubkey), this.account.secretKey),
    );
    if (!res.ok) {
      throw new Error(res.message || "The relay would not remove that member.");
    }
  }

  /** Admin only: makes a single-use invite string to hand to someone. */
  async createInvite(): Promise<string> {
    const code = randomCode();
    const conn = await this.connection(this.account);
    const res = await conn.publish(
      signEvent(createInvite(this.groupId, code), this.account.secretKey),
    );
    if (!res.ok) {
      throw new Error(res.message || "The relay would not make an invite.");
    }
    return encodeInvite(this.relayUrl, this.groupId, code);
  }

  /**
   * Gives this person an agent of their own: a new key, a profile marked as a bot that
   * names its owner, and a place in the team. Needs the owner to be an admin.
   */
  async addAgent(name: string, secretKey?: string): Promise<Account> {
    const agent = secretKey
      ? accountFromSecret(secretKey, {
          name,
          kind: "agent",
          ownerPubkey: this.account.pubkey,
        })
      : generateAccount(name, {
          kind: "agent",
          ownerPubkey: this.account.pubkey,
        });
    await this.publishProfile(agent);
    await this.addMember(agent.pubkey, ["member"]);
    this.agents.set(agent.pubkey, agent);
    return agent;
  }

  /** Re-attach an agent this person created earlier (its key is kept in their browser). */
  adoptAgent(agent: Account) {
    this.agents.set(agent.pubkey, agent);
  }

  close() {
    this.unsubs.forEach((u) => u());
    this.connections.forEach((c) => c.close());
    this.connections.clear();
  }
}
