import type { SyntheticEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Server } from "lucide-react";
import {
  detectLocalBackends,
  type DetectedBackend,
} from "#/api/detect-local-backends";
import { useActiveBackendContext } from "#/contexts/active-backend-context";
import { I18nKey } from "#/i18n/declaration";
import {
  dropdownFooterActionClassName,
  dropdownMenuListClassName,
  dropdownMenuRowIconWrapperClassName,
} from "#/utils/dropdown-classes";
import { cn } from "#/utils/utils";

const trimHost = (host: string): string => host.trim().replace(/\/+$/, "");

interface DetectedBackendsMenuSectionProps {
  onPick: (backend: DetectedBackend) => void;
  /** Keeps the dropdown open on press, as the neighbouring footer buttons do. */
  preventClose: (event: SyntheticEvent<HTMLButtonElement>) => void;
}

/** Local Agent Servers on this machine that are not added yet, in the account menu. */
export function DetectedBackendsMenuSection({
  onPick,
  preventClose,
}: DetectedBackendsMenuSectionProps) {
  const { t } = useTranslation("openhands");
  const { backends } = useActiveBackendContext();
  const { data } = useQuery({
    queryKey: ["detected-local-backends"],
    queryFn: () => detectLocalBackends(),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const added = new Set(backends.map((backend) => trimHost(backend.host)));
  const fresh = (data ?? []).filter(
    (backend) => backend.identified && !added.has(trimHost(backend.host)),
  );
  if (fresh.length === 0) return null;

  return (
    <div
      data-testid="detected-backends-menu"
      className={cn(dropdownMenuListClassName, "border-t border-border")}
    >
      <p className="px-2 pt-2 text-xs text-muted">
        {t(I18nKey.BACKEND$DETECTED_TITLE)}
      </p>
      {fresh.map((backend) => (
        <button
          key={backend.host}
          type="button"
          data-testid="detected-backend-menu-item"
          onMouseDown={preventClose}
          onTouchStart={preventClose}
          onClick={(event) => {
            preventClose(event);
            onPick(backend);
          }}
          className={cn(
            dropdownFooterActionClassName,
            "cursor-pointer rounded-md",
          )}
        >
          <span className={dropdownMenuRowIconWrapperClassName} aria-hidden>
            <Server width={16} height={16} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate">{backend.host}</span>
            <span className="text-xs text-muted">
              {t(I18nKey.BACKEND$DETECTED_AGENT_SERVER, {
                version: backend.version ?? "",
              })}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
