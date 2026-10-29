import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RefreshCw, Server } from "lucide-react";
import {
  detectLocalBackends,
  type DetectedBackend,
} from "#/api/detect-local-backends";
import { I18nKey } from "#/i18n/declaration";

interface DetectedBackendsListProps {
  onPick: (backend: DetectedBackend) => void;
}

/** Local Agent Servers found on this machine; picking one fills the form. */
export function DetectedBackendsList({ onPick }: DetectedBackendsListProps) {
  const { t } = useTranslation("openhands");
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["detected-local-backends"],
    queryFn: () => detectLocalBackends(),
    // A server can start or stop at any time, so every open rescans.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  return (
    <section data-testid="detected-backends" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-contrast">
          {t(I18nKey.BACKEND$DETECTED_TITLE)}
        </h3>
        <button
          type="button"
          data-testid="detected-backends-rescan"
          aria-label={t(I18nKey.BACKEND$DETECTED_RESCAN)}
          title={t(I18nKey.BACKEND$DETECTED_RESCAN)}
          disabled={isFetching}
          onClick={() => refetch()}
          className="rounded-full p-1.5 text-muted hover:bg-surface-raised hover:text-contrast disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={
              isFetching ? "animate-spin motion-reduce:animate-none" : ""
            }
          />
        </button>
      </div>
      {isFetching && !data ? (
        <p className="text-xs text-muted">
          {t(I18nKey.BACKEND$DETECTED_SCANNING)}
        </p>
      ) : null}
      {!isFetching && data?.length === 0 ? (
        <p data-testid="detected-backends-none" className="text-xs text-muted">
          {t(I18nKey.BACKEND$DETECTED_NONE)}
        </p>
      ) : null}
      {data && data.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {data.map((backend) => (
            <li key={backend.host}>
              <button
                type="button"
                data-testid="detected-backend"
                data-identified={backend.identified ? "true" : "false"}
                // A listener the browser cannot read cannot be connected to
                // from this page either, so it is shown but not selectable.
                disabled={!backend.identified}
                onClick={() => onPick(backend)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Server size={16} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-contrast">
                    {backend.host}
                  </span>
                  <span className="block text-xs text-muted">
                    {backend.identified
                      ? [
                          t(I18nKey.BACKEND$DETECTED_AGENT_SERVER, {
                            version: backend.version ?? "",
                          }),
                          backend.requiresApiKey
                            ? t(I18nKey.BACKEND$DETECTED_KEY_REQUIRED)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : t(I18nKey.BACKEND$DETECTED_UNVERIFIED)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
