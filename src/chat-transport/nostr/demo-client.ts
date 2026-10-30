import type { Account } from "./keys";
import { generateAccount } from "./keys";
import type { TeamClient, TeamMember, TeamMessage } from "./team-client";
import type { RequestProgress } from "#/stores/team-chat-store";

type Listener = () => void;

/**
 * A team that lives only in memory, with the same surface the team screens use from
 * {@link TeamClient}: members, messages, posting, adding people and agents. Nothing is
 * sent to a relay and nothing is saved, so the screens can show a populated team behind
 * the sign-in dialog.
 */
export class DemoTeamClient {
  readonly account: Account;

  readonly relayUrl = "demo";

  readonly groupId = "demo";

  readonly name = "Kosmonauts";

  private people: TeamMember[] = [];

  private agents = new Map<string, Account>();

  private list: TeamMessage[] = [];

  private listeners = new Set<Listener>();

  private clock: number;

  constructor(account: Account, now = Math.floor(Date.now() / 1000)) {
    this.account = account;
    this.clock = now - 3600;
  }

  seedMember(member: TeamMember, agent?: Account) {
    this.people.push(member);
    if (agent) this.agents.set(agent.pubkey, agent);
  }

  seedMessage(
    pubkey: string,
    text: string,
    opts: { parent?: string | null; mentions?: string[] } = {},
  ): TeamMessage {
    this.clock += 240;
    const message: TeamMessage = {
      id: `demo-${this.list.length + 1}`,
      pubkey,
      createdAt: this.clock,
      text,
      parent: opts.parent ?? null,
      mentions: opts.mentions ?? [],
    };
    this.list.push(message);
    return message;
  }

  members(): TeamMember[] {
    return [...this.people];
  }

  isAdmin(pubkey = this.account.pubkey): boolean {
    return (
      this.people.find((m) => m.pubkey === pubkey)?.roles.includes("admin") ??
      false
    );
  }

  messages(): TeamMessage[] {
    return [...this.list];
  }

  nameOf(pubkey: string): string {
    return this.people.find((m) => m.pubkey === pubkey)?.name ?? "Someone";
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

  async post(
    text: string,
    opts: { parent?: string | null; mentions?: string[]; as?: Account } = {},
  ): Promise<void> {
    this.clock = Math.max(this.clock + 1, Math.floor(Date.now() / 1000));
    const author = opts.as ?? this.account;
    this.list.push({
      id: `demo-${this.list.length + 1}`,
      pubkey: author.pubkey,
      createdAt: this.clock,
      text,
      parent: opts.parent ?? null,
      mentions: opts.mentions ?? [],
    });
    this.emit();
  }

  async addMember(npubOrHex: string): Promise<string> {
    const pubkey = `demo-${npubOrHex.slice(0, 12)}`;
    this.people.push({
      pubkey,
      npub: npubOrHex,
      name: npubOrHex.slice(0, 12),
      roles: ["member"],
      kind: "person",
    });
    this.emit();
    return pubkey;
  }

  async removeMember(pubkey: string): Promise<void> {
    this.people = this.people.filter((m) => m.pubkey !== pubkey);
    this.emit();
  }

  async createInvite(): Promise<string> {
    return "buzzteam:ws://127.0.0.1:4869#kosmonauts-demo:sample-invite";
  }

  async addAgent(name: string): Promise<Account> {
    const agent = generateAccount(name, {
      kind: "agent",
      ownerPubkey: this.account.pubkey,
    });
    this.agents.set(agent.pubkey, agent);
    this.people.push({
      pubkey: agent.pubkey,
      npub: agent.npub,
      name,
      roles: ["member"],
      kind: "agent",
      owner: this.account.pubkey,
    });
    this.emit();
    return agent;
  }

  adoptAgent(agent: Account) {
    this.agents.set(agent.pubkey, agent);
  }

  close() {}
}

export interface SampleTeam {
  client: TeamClient;
  me: Account;
  agent: Account;
  requests: Record<string, RequestProgress>;
  agentsByOwner: Record<string, Account[]>;
}

/** A small team to look at: three people, three agents, a thread, and one request waiting on you. */
export function createSampleTeam(): SampleTeam {
  const me = generateAccount("Maya Chen");
  const dev = generateAccount("Dev Patel");
  const lena = generateAccount("Lena Fischer");
  const atlas = generateAccount("Atlas", {
    kind: "agent",
    ownerPubkey: me.pubkey,
  });
  const forge = generateAccount("Forge", {
    kind: "agent",
    ownerPubkey: dev.pubkey,
  });
  const sage = generateAccount("Sage", {
    kind: "agent",
    ownerPubkey: lena.pubkey,
  });
  const client = new DemoTeamClient(me);
  const person = (a: Account, roles: string[]): TeamMember => ({
    pubkey: a.pubkey,
    npub: a.npub,
    name: a.name,
    roles,
    kind: "person",
  });
  const agent = (a: Account): TeamMember => ({
    pubkey: a.pubkey,
    npub: a.npub,
    name: a.name,
    roles: ["member"],
    kind: "agent",
    owner: a.ownerPubkey,
  });
  client.seedMember(person(me, ["admin", "member"]));
  client.seedMember(person(dev, ["member"]));
  client.seedMember(person(lena, ["member"]));
  client.seedMember(agent(atlas), atlas);
  client.seedMember(agent(forge));
  client.seedMember(agent(sage));
  const first = client.seedMessage(
    dev.pubkey,
    "Morning all. Is Thursday still the target for the website release?",
  );
  const move = client.seedMessage(
    me.pubkey,
    "Actually, we can move it to Tuesday. We are ahead of schedule.",
    { parent: first.id },
  );
  client.seedMessage(
    atlas.pubkey,
    "Release notes are drafted. Two PRs still need a review: #4521 and #88.",
    { parent: move.id },
  );
  const hero = client.seedMessage(
    lena.pubkey,
    "@Forge can you check the hero image sizes on mobile?",
    { mentions: [forge.pubkey] },
  );
  client.seedMessage(
    forge.pubkey,
    "Dev has to approve this first. I will start once he does.",
    { parent: hero.id },
  );
  client.seedMessage(
    dev.pubkey,
    "@Atlas can you summarise the render-scale PR for the changelog?",
    { mentions: [atlas.pubkey] },
  );
  return {
    client: client as unknown as TeamClient,
    me,
    agent: atlas,
    requests: {},
    agentsByOwner: { [me.pubkey]: [atlas] },
  };
}
