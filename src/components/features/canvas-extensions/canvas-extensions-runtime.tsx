import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import CanvasExtensionsService from "#/api/canvas-extensions-service";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { mountCanvasExtensionAppView } from "#/extensions/canvas-extension-app-view";
import { loadCanvasExtensionModule } from "#/extensions/canvas-extension-module-loader";
import { useCanvasExtensions } from "#/hooks/query/use-canvas-extensions";
import { I18nKey } from "#/i18n/declaration";
import { subscribeCanvasExtensionIntents } from "#/stores/canvas-extension-intent-store";
import {
  CANVAS_EXTENSION_CREATE_ACTION_ICON_MAX_LENGTH,
  CANVAS_EXTENSION_CREATE_ACTION_LABEL_MAX_LENGTH,
  CANVAS_EXTENSION_HOST_API_VERSION,
  type CanvasExtensionCreateAction,
  type CanvasExtensionDispose,
  type CanvasExtensionHost,
  type CanvasExtensionModule,
  type CanvasExtensionPageContribution,
  type CanvasExtensionPageMount,
  type InstalledCanvasExtensionInfo,
} from "#/types/canvas-extension";

export interface RegisteredCanvasExtensionPage {
  extension: InstalledCanvasExtensionInfo;
  contribution: CanvasExtensionPageContribution;
  mount: CanvasExtensionPageMount;
  href: string;
}

/** An entry an extension added to the New Chat menu, ready to render. */
export interface RegisteredCanvasExtensionCreateAction {
  extension: InstalledCanvasExtensionInfo;
  action: CanvasExtensionCreateAction;
  href: string;
}

interface CanvasExtensionsRuntimeValue {
  pages: RegisteredCanvasExtensionPage[];
  /** Ordered by extension name, then registration order. */
  createActions: RegisteredCanvasExtensionCreateAction[];
  activating: boolean;
  errors: ReadonlyMap<string, string>;
}

const EMPTY_RUNTIME: CanvasExtensionsRuntimeValue = {
  pages: [],
  createActions: [],
  activating: false,
  errors: new Map(),
};

const CanvasExtensionsRuntimeContext =
  React.createContext<CanvasExtensionsRuntimeValue>(EMPTY_RUNTIME);

export function useCanvasExtensionsRuntime(): CanvasExtensionsRuntimeValue {
  return React.useContext(CanvasExtensionsRuntimeContext);
}

function isValidSegment(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function buildCanvasExtensionPageHref(
  extensionName: string,
  contributionPath: string,
): string {
  return `/extensions/${encodeURIComponent(extensionName)}/${contributionPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function getDeclaredPage(
  extension: InstalledCanvasExtensionInfo,
  contributionId: string,
): CanvasExtensionPageContribution {
  const contribution = extension.manifest?.contributes?.pages?.find(
    (page) => page.id === contributionId,
  );
  if (!contribution) {
    throw new Error(
      `Extension ${extension.name} registered undeclared page "${contributionId}".`,
    );
  }
  // The backend declares page paths as absolute routes (e.g. "/dashboard");
  // normalize to the relative form used for hrefs and route matching.
  const normalizedPath = contribution.path.replace(/^\/+/, "");
  if (
    !isValidSegment(extension.name) ||
    !isValidSegment(contribution.id) ||
    !normalizedPath.split("/").every(isValidSegment)
  ) {
    throw new Error(
      `Extension ${extension.name} has an invalid page name, id, or path.`,
    );
  }
  return { ...contribution, path: normalizedPath };
}

const CREATE_ACTION_DESCRIPTION_MAX_LENGTH = 200;
const CREATE_ACTION_INTENT_MAX_LENGTH = 200;

/** Throws a clear error for a malformed create action; returns the normalized copy. */
function validateCreateAction(
  extension: InstalledCanvasExtensionInfo,
  action: CanvasExtensionCreateAction,
): CanvasExtensionCreateAction {
  const fail = (reason: string): never => {
    throw new Error(
      `Extension ${extension.name} registered an invalid create action: ${reason}.`,
    );
  };
  if (!action || typeof action !== "object") fail("expected an object");
  if (typeof action.id !== "string" || !isValidSegment(action.id)) {
    fail("id must use lowercase letters, digits, and hyphens");
  }
  const label = typeof action.label === "string" ? action.label.trim() : "";
  if (
    label.length < 1 ||
    label.length > CANVAS_EXTENSION_CREATE_ACTION_LABEL_MAX_LENGTH
  ) {
    fail(
      `label must be 1-${CANVAS_EXTENSION_CREATE_ACTION_LABEL_MAX_LENGTH} characters`,
    );
  }
  if (
    action.description !== undefined &&
    (typeof action.description !== "string" ||
      action.description.length > CREATE_ACTION_DESCRIPTION_MAX_LENGTH)
  ) {
    fail(
      `description must be a string of at most ${CREATE_ACTION_DESCRIPTION_MAX_LENGTH} characters`,
    );
  }
  if (
    action.intent !== undefined &&
    (typeof action.intent !== "string" ||
      action.intent.length > CREATE_ACTION_INTENT_MAX_LENGTH)
  ) {
    fail(
      `intent must be a string of at most ${CREATE_ACTION_INTENT_MAX_LENGTH} characters`,
    );
  }
  if (action.icon !== undefined) {
    const svg = action.icon?.svg;
    if (
      typeof svg !== "string" ||
      !/^\s*<svg[\s>]/i.test(svg) ||
      svg.length > CANVAS_EXTENSION_CREATE_ACTION_ICON_MAX_LENGTH
    ) {
      fail(
        `icon.svg must be inline <svg> markup of at most ${CANVAS_EXTENSION_CREATE_ACTION_ICON_MAX_LENGTH} characters`,
      );
    }
  }
  return { ...action, label };
}

type CanvasExtensionModuleLoader = (
  source: string,
) => Promise<CanvasExtensionModule>;

interface CanvasExtensionsRuntimeProviderProps {
  children: React.ReactNode;
  /** Test seam for environments that cannot import browser Blob URLs. */
  moduleLoader?: CanvasExtensionModuleLoader;
}

export function CanvasExtensionsRuntimeProvider({
  children,
  moduleLoader = loadCanvasExtensionModule,
}: CanvasExtensionsRuntimeProviderProps) {
  const active = useActiveBackend();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("openhands");
  const query = useCanvasExtensions();
  const [pages, setPages] = React.useState<RegisteredCanvasExtensionPage[]>([]);
  const [createActions, setCreateActions] = React.useState<
    RegisteredCanvasExtensionCreateAction[]
  >([]);
  const [errors, setErrors] = React.useState<ReadonlyMap<string, string>>(
    new Map(),
  );
  const [activating, setActivating] = React.useState(false);

  const enabledExtensions = React.useMemo(
    () => (query.data ?? []).filter((extension) => extension.enabled),
    [query.data],
  );

  // `useActiveBackend` can synthesize a fresh `backend` object on every render
  // (e.g. when mounted without an <ActiveBackendProvider>), and refetches
  // produce new extension arrays with identical content. The activation effect
  // therefore keys on this value signature — backend identity plus the enabled
  // inventory, whose `installedAt` catches a same-version refresh — and reads
  // the current objects from refs, so referential churn never tears down and
  // re-activates extensions.
  const activationSignature = React.useMemo(
    () =>
      JSON.stringify({
        backendId: active.backend.id,
        backendKind: active.backend.kind,
        connectionRevision: active.backend.connectionRevision ?? 0,
        orgId: active.orgId,
        extensions: enabledExtensions.map((extension) => ({
          name: extension.name,
          version: extension.version,
          resolvedRef: extension.resolved_ref ?? null,
          installedAt: extension.installed_at,
          pages: extension.manifest?.contributes?.pages ?? [],
        })),
      }),
    [
      active.backend.id,
      active.backend.kind,
      active.backend.connectionRevision,
      active.orgId,
      enabledExtensions,
    ],
  );
  const activeRef = React.useRef(active);
  activeRef.current = active;
  const enabledExtensionsRef = React.useRef(enabledExtensions);
  enabledExtensionsRef.current = enabledExtensions;
  const appViewLabels = React.useMemo(
    () => ({
      loading: t(I18nKey.SETTINGS$APPS_VIEW_LOADING),
      retry: t(I18nKey.SETTINGS$APPS_VIEW_RETRY),
      openInNewTab: t(I18nKey.SETTINGS$APPS_VIEW_OPEN_NEW_TAB),
      unavailable: t(I18nKey.SETTINGS$APPS_VIEW_UNAVAILABLE),
    }),
    [i18n.resolvedLanguage, t],
  );
  const appViewLabelsRef = React.useRef(appViewLabels);
  appViewLabelsRef.current = appViewLabels;

  React.useEffect(() => {
    let cancelled = false;
    const disposers: CanvasExtensionDispose[] = [];
    const { backend, orgId } = activeRef.current;
    const extensionsToActivate = enabledExtensionsRef.current;
    setPages([]);
    setCreateActions([]);
    setErrors(new Map());
    setActivating(extensionsToActivate.length > 0);

    const activateExtension = async (
      extension: InstalledCanvasExtensionInfo,
    ) => {
      const registeredPages = new Map<string, RegisteredCanvasExtensionPage>();
      const registeredCreateActions = new Map<
        string,
        RegisteredCanvasExtensionCreateAction
      >();
      const registrationDisposers: CanvasExtensionDispose[] = [];
      // Create actions are published once activation resolves, then kept in
      // step with later registrations and disposals.
      let published = false;
      const publishCreateActions = () => {
        if (!published || cancelled) return;
        setCreateActions((current) =>
          [
            ...current.filter(
              (entry) => entry.extension.name !== extension.name,
            ),
            ...registeredCreateActions.values(),
          ].sort((left, right) =>
            left.extension.name.localeCompare(right.extension.name),
          ),
        );
      };
      try {
        const source = await CanvasExtensionsService.fetchBundle(
          extension.name,
          backend,
        );
        if (cancelled) return;
        const extensionModule = await moduleLoader(source);
        if (cancelled) return;
        const appBackendViewClient =
          await CanvasExtensionsService.createAppBackendViewClient(
            extension.name,
            backend,
          ).catch(() => null);
        if (cancelled) {
          appBackendViewClient?.dispose();
          return;
        }
        const mountedAppViews = new Set<CanvasExtensionDispose>();
        const disposeAppBackendViews = () => {
          for (const dispose of mountedAppViews) dispose();
          mountedAppViews.clear();
          appBackendViewClient?.dispose();
        };
        disposers.push(disposeAppBackendViews);

        const host: CanvasExtensionHost = {
          apiVersion: CANVAS_EXTENSION_HOST_API_VERSION,
          extension: Object.freeze({
            name: extension.name,
            version: extension.version,
            resolvedRef: extension.resolved_ref ?? null,
          }),
          backend: Object.freeze({
            id: backend.id,
            kind: backend.kind,
            orgId,
          }),
          registerPage: (contributionId, mount) => {
            if (registeredPages.has(contributionId)) {
              throw new Error(
                `Extension ${extension.name} registered page "${contributionId}" more than once.`,
              );
            }
            const contribution = getDeclaredPage(extension, contributionId);
            const page: RegisteredCanvasExtensionPage = {
              extension,
              contribution,
              mount,
              href: buildCanvasExtensionPageHref(
                extension.name,
                contribution.path,
              ),
            };
            registeredPages.set(contributionId, page);
            const unregister = () => registeredPages.delete(contributionId);
            registrationDisposers.push(unregister);
            return unregister;
          },
          registerCreateAction: (rawAction) => {
            const action = validateCreateAction(extension, rawAction);
            if (registeredCreateActions.has(action.id)) {
              throw new Error(
                `Extension ${extension.name} registered create action "${action.id}" more than once.`,
              );
            }
            const page = getDeclaredPage(extension, action.pageId);
            registeredCreateActions.set(action.id, {
              extension,
              action,
              href: buildCanvasExtensionPageHref(extension.name, page.path),
            });
            publishCreateActions();
            const unregister = () => {
              if (registeredCreateActions.delete(action.id)) {
                publishCreateActions();
              }
            };
            registrationDisposers.push(unregister);
            return unregister;
          },
          onIntent: (callback) => {
            const unsubscribe = subscribeCanvasExtensionIntents(
              extension.name,
              callback,
            );
            registrationDisposers.push(unsubscribe);
            return unsubscribe;
          },
          navigate: (path) => navigate(path),
          agentServer: {
            request: (request) =>
              CanvasExtensionsService.requestAgentServer(request, backend),
          },
          ...(appBackendViewClient
            ? {
                appBackendView: {
                  mount: ({ container }) => {
                    const mounted = mountCanvasExtensionAppView({
                      container,
                      labels: appViewLabelsRef.current,
                      createSession: ({ signal }) =>
                        appBackendViewClient.createSession(signal),
                      revokeSession: () => appBackendViewClient.revokeSession(),
                    });
                    let disposed = false;
                    const dispose = () => {
                      if (disposed) return;
                      disposed = true;
                      mountedAppViews.delete(dispose);
                      mounted.dispose();
                    };
                    mountedAppViews.add(dispose);
                    return dispose;
                  },
                },
              }
            : {}),
        };

        let disposeActivation: void | CanvasExtensionDispose;
        try {
          disposeActivation = await extensionModule.activate(host);
        } catch (error) {
          disposeAppBackendViews();
          throw error;
        }
        if (cancelled) {
          if (typeof disposeActivation === "function") disposeActivation();
          disposeAppBackendViews();
          return;
        }
        if (typeof disposeActivation === "function") {
          disposers.push(disposeActivation);
        }
        // Read the list at disposal time so registrations made after
        // activation resolves are cleaned up too.
        disposers.push(() => registrationDisposers.forEach((d) => d()));
        published = true;
        publishCreateActions();
        setPages((current) => [
          ...current.filter((page) => page.extension.name !== extension.name),
          ...registeredPages.values(),
        ]);
      } catch (error) {
        registrationDisposers.forEach((dispose) => dispose());
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Extension activation failed.";
        setErrors((current) => {
          const next = new Map(current);
          next.set(extension.name, message);
          return next;
        });
      }
    };

    void Promise.all(extensionsToActivate.map(activateExtension)).finally(
      () => {
        if (!cancelled) setActivating(false);
      },
    );

    return () => {
      cancelled = true;
      setPages([]);
      setCreateActions([]);
      for (const dispose of disposers.reverse()) {
        try {
          dispose();
        } catch (error) {
          console.error("Canvas Extension cleanup failed", error);
        }
      }
    };
  }, [activationSignature, moduleLoader, navigate]);

  const value = React.useMemo(
    () => ({ pages, createActions, activating, errors }),
    [pages, createActions, activating, errors],
  );

  return (
    <CanvasExtensionsRuntimeContext.Provider value={value}>
      {children}
    </CanvasExtensionsRuntimeContext.Provider>
  );
}
