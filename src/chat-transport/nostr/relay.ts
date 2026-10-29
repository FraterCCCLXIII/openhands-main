import { authEvent } from "./nip29";
import { signEvent, type NostrEvent } from "./event";

export interface Filter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [tag: `#${string}`]: string[] | undefined;
}

export interface PublishResult {
  ok: boolean;
  message: string;
}

type SocketLike = Pick<WebSocket, "send" | "close" | "readyState"> & {
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
};

interface Sub {
  filters: Filter[];
  onEvent: (e: NostrEvent) => void;
  onEose?: () => void;
}

/**
 * One relay connection for one signing key: NIP-01 subscriptions and publishing, with
 * NIP-42 sign-in when the relay asks for it. The key signs the AUTH event here; it is
 * never sent anywhere.
 */
export class RelayConnection {
  private ws: SocketLike | null = null;
  private subs = new Map<string, Sub>();
  private pending = new Map<string, (r: PublishResult) => void>();
  private seq = 0;
  private authed = false;
  private authWaiters: Array<() => void> = [];
  private closed = false;

  constructor(
    readonly url: string,
    private readonly secretKey: string,
    private readonly makeSocket: (url: string) => SocketLike = (u) =>
      new WebSocket(u) as unknown as SocketLike,
  ) {}

  /** Opens the socket and waits until the relay has accepted our sign-in, or says it needs none. */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = this.makeSocket(this.url);
      this.ws = ws;
      let settled = false;
      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };
      ws.onopen = () => {
        // A relay that never asks for AUTH still works: give it a moment, then carry on.
        setTimeout(() => done(), 400);
      };
      ws.onerror = () =>
        done(new Error(`Could not reach the relay at ${this.url}.`));
      ws.onclose = () => {
        this.authed = false;
        done(new Error(`The relay at ${this.url} closed the connection.`));
      };
      ws.onmessage = (ev) => this.onMessage(String(ev.data), done);
    });
  }

  private onMessage(raw: string, onAuthed: () => void) {
    let msg: unknown[];
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const [type, a, b, c] = msg as [string, unknown, unknown, unknown];
    if (type === "AUTH" && typeof a === "string") {
      const ev = signEvent(authEvent(this.url, a), this.secretKey);
      this.pending.set(ev.id, (r) => {
        this.authed = r.ok;
        this.authWaiters.splice(0).forEach((w) => w());
        if (r.ok) onAuthed();
      });
      this.ws?.send(JSON.stringify(["AUTH", ev]));
    } else if (type === "EVENT" && typeof a === "string") {
      this.subs.get(a)?.onEvent(b as NostrEvent);
    } else if (type === "EOSE" && typeof a === "string") {
      this.subs.get(a)?.onEose?.();
    } else if (type === "OK" && typeof a === "string") {
      const done = this.pending.get(a);
      this.pending.delete(a);
      done?.({ ok: b === true, message: typeof c === "string" ? c : "" });
    } else if (type === "CLOSED" && typeof a === "string") {
      this.subs.delete(a);
    }
  }

  subscribe(
    filters: Filter[],
    onEvent: (e: NostrEvent) => void,
    onEose?: () => void,
  ): () => void {
    const id = `s${(this.seq += 1)}`;
    this.subs.set(id, { filters, onEvent, onEose });
    this.ws?.send(JSON.stringify(["REQ", id, ...filters]));
    return () => {
      this.subs.delete(id);
      if (!this.closed) this.ws?.send(JSON.stringify(["CLOSE", id]));
    };
  }

  /** Publishes a signed event and resolves with the relay's verdict. */
  publish(event: NostrEvent): Promise<PublishResult> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(event.id);
        resolve({ ok: false, message: "The relay did not answer." });
      }, 8000);
      this.pending.set(event.id, (r) => {
        clearTimeout(timer);
        resolve(r);
      });
      this.ws?.send(JSON.stringify(["EVENT", event]));
    });
  }

  close() {
    this.closed = true;
    this.ws?.close();
  }
}
