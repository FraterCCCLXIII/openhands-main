export const CANVAS_EXTENSION_MANIFEST_SCHEMA_VERSION = 1 as const;
export const CANVAS_EXTENSION_HOST_API_VERSION = "1" as const;

/** Icon appearance configuration for the sidebar and cards. */
export interface CanvasExtensionIconAppearance {
  /** Background color for the icon (CSS color value or predefined key). */
  background?: string | null;
  /** Emoji to display as the icon (overrides SVG icon). */
  emoji?: string | null;
  /** Lucide icon name (e.g., "folder", "database"). */
  lucide_icon?: string | null;
}

export interface CanvasExtensionPageContribution {
  id: string;
  title: string;
  path: string;
  nav_label?: string | null;
  description?: string | null;
}

export interface CanvasExtensionContributions {
  pages?: CanvasExtensionPageContribution[] | null;
}

/** Parsed contents of `canvas-extension.json`. */
export interface CanvasExtensionManifest {
  schema_version: typeof CANVAS_EXTENSION_MANIFEST_SCHEMA_VERSION;
  name: string;
  display_name?: string | null;
  version: string;
  description?: string | null;
  entrypoint: string;
  contributes?: CanvasExtensionContributions | null;
  /** Package-relative SVG path; served by the Agent Server at `/installed/{name}/icon`. */
  icon?: string | null;
  /** Icon appearance settings for sidebar and cards. */
  icon_appearance?: CanvasExtensionIconAppearance | null;
  /** Who made the app. */
  author?: string | null;
  /** Project or product page. */
  homepage?: string | null;
  /** Where to get help. */
  support_url?: string | null;
  /** SPDX identifier or name of the licence. */
  license?: string | null;
  /** Listing price shown in the App Store. Display only; no payment is processed. */
  pricing?: {
    model: "free" | "one-time" | "subscription";
    /** USD. */
    amount?: number;
    period?: "month" | "year";
    /** True when the price is demo data, not a real offer. */
    sample?: boolean;
  } | null;
}

export interface InstalledCanvasExtensionInfo {
  name: string;
  version: string;
  description?: string | null;
  enabled: boolean;
  source: string;
  requested_ref?: string | null;
  resolved_ref?: string | null;
  repo_path?: string | null;
  installed_at: string;
  install_path: string;
  /** Absent until the backend exposes page contributions (OSS-10048). */
  manifest?: CanvasExtensionManifest | null;
}

export interface InstallCanvasExtensionRequest {
  source: string;
  ref?: string | null;
  repo_path?: string | null;
  force?: boolean;
}

export type CanvasExtensionDispose = () => void;

/**
 * What a create action asks of its page. `id` is the registered create action's
 * id, `action` is the action's opaque `intent` string (the action id when it
 * gave none), and `at` is the epoch-millisecond time the user picked it.
 */
export interface CanvasExtensionIntent {
  id: string;
  action: string;
  at: number;
}

export interface CanvasExtensionPageMountContext {
  container: HTMLElement;
  /** Remainder of the route below the page contribution's declared path. */
  path: string;
  navigate: (path: string) => void;
  /**
   * Set when the page was opened from a create action (New Chat menu). It is
   * delivered once; a later plain visit sees `null`/`undefined`.
   */
  intent?: CanvasExtensionIntent | null;
}

export type CanvasExtensionPageMount = (
  context: CanvasExtensionPageMountContext,
) => void | CanvasExtensionDispose | Promise<void | CanvasExtensionDispose>;

export interface CanvasExtensionAgentServerRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface CanvasExtensionAppBackendViewMountOptions {
  container: HTMLElement;
}

export interface CanvasExtensionAppBackendViewHost {
  mount: (
    options: CanvasExtensionAppBackendViewMountOptions,
  ) => CanvasExtensionDispose;
}

/** Limits the host enforces on `registerCreateAction`. */
export const CANVAS_EXTENSION_CREATE_ACTION_LABEL_MAX_LENGTH = 40;
export const CANVAS_EXTENSION_CREATE_ACTION_ICON_MAX_LENGTH = 4096;

/** An entry an extension adds to the left nav's New Chat menu. */
export interface CanvasExtensionCreateAction {
  /** Lowercase letters, digits, and hyphens; unique within the extension. */
  id: string;
  /** Short, sentence case (1-40 characters), e.g. "New document". */
  label: string;
  /** Shown as the row's tooltip. */
  description?: string;
  /**
   * Inline SVG markup that paints with `currentColor` (max 4096 characters).
   * Rendered as a mask, never as HTML. Omit it to show the extension's icon.
   */
  icon?: { svg: string };
  /** A page this extension declared; the host navigates there. */
  pageId: string;
  /** Opaque string delivered to the page as `intent.action`. */
  intent?: string;
}

export interface CanvasExtensionHost {
  readonly apiVersion: typeof CANVAS_EXTENSION_HOST_API_VERSION;
  readonly extension: Readonly<{
    name: string;
    version: string;
    resolvedRef: string | null;
  }>;
  readonly backend: Readonly<{
    id: string;
    kind: "local" | "cloud";
    orgId: string | null;
  }>;
  registerPage: (
    contributionId: string,
    mount: CanvasExtensionPageMount,
  ) => CanvasExtensionDispose;
  /**
   * Adds an entry to the New Chat menu. Throws on an invalid registration;
   * the returned function removes the entry.
   */
  registerCreateAction: (
    action: CanvasExtensionCreateAction,
  ) => CanvasExtensionDispose;
  /**
   * Called when a create action targets a page of this extension that is
   * already mounted, so the page can start its create flow without remounting.
   */
  onIntent: (
    callback: (intent: CanvasExtensionIntent) => void,
  ) => CanvasExtensionDispose;
  navigate: (path: string) => void;
  agentServer: {
    request: <T = unknown>(
      request: CanvasExtensionAgentServerRequest,
    ) => Promise<T>;
  };
  readonly appBackendView?: CanvasExtensionAppBackendViewHost;
}

export interface CanvasExtensionModule {
  activate: (
    host: CanvasExtensionHost,
  ) => void | CanvasExtensionDispose | Promise<void | CanvasExtensionDispose>;
}
