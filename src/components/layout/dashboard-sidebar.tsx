import type { LucideIcon } from "lucide-react";
import { CheckCircle2, KeyRound, PlugZap, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { getAdminSectionPath, type AdminSection } from "@/src/lib/admin-routes";
import { cn } from "@/src/lib/utils";

export type DashboardSidebarItemId = AdminSection | "adminIntegrations";

const sidebarLinkClassName =
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors";

const DASHBOARD_SECTION_ITEMS: Array<{
  id: AdminSection;
  label: string;
  icon: LucideIcon;
  href: string;
}> = [
  {
    id: "integrations",
    label: "Integrations",
    icon: PlugZap,
    href: getAdminSectionPath("integrations"),
  },
  {
    id: "caseByCaseApprovals",
    label: "Case-by-case Approvals",
    icon: CheckCircle2,
    href: getAdminSectionPath("caseByCaseApprovals"),
  },
  {
    id: "apiKeys",
    label: "Agent Connection",
    icon: KeyRound,
    href: getAdminSectionPath("apiKeys"),
  },
  {
    id: "profile",
    label: "User Profile",
    icon: User,
    href: getAdminSectionPath("profile"),
  },
];

const ADMIN_INTEGRATIONS_ITEM = {
  id: "adminIntegrations" as const,
  label: "Admin integrations",
  icon: ShieldCheck,
  href: "/admin-integrations",
};

export const getDashboardSections = (
  showApprovalsLink = true,
): Array<{
  id: AdminSection;
  label: string;
  icon: LucideIcon;
}> =>
  DASHBOARD_SECTION_ITEMS.filter(
    (item) => showApprovalsLink || item.id !== "caseByCaseApprovals",
  ).map(({ id, label, icon }) => ({ id, label, icon }));

const DashboardSidebarLink = ({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) => (
  <Link
    href={href}
    className={cn(
      sidebarLinkClassName,
      active
        ? "bg-[var(--color-bg-active)] text-white"
        : "text-[var(--color-text-base)] hover:bg-[var(--color-bg-active)] hover:text-white",
    )}
  >
    <Icon
      className={cn(
        "h-4 w-4 shrink-0",
        active ? "text-[var(--color-accent)]" : "text-[var(--color-text-base)]",
      )}
    />
    <span className="truncate font-medium">{label}</span>
  </Link>
);

export const DashboardSidebarUserPanel = ({
  userName,
  userEmail,
  badges = [],
  action,
}: {
  userName: string;
  userEmail: string;
  badges?: ReactNode[];
  action?: ReactNode;
}) => (
  <div className="space-y-3">
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-base)]">
        Signed in as
      </p>
      <p className="mt-1 text-sm font-medium text-white">{userName}</p>
      <p className="mt-1 break-all text-xs text-[var(--color-text-base)]">{userEmail}</p>
    </div>
    {badges.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, index) => (
          <Fragment key={index}>{badge}</Fragment>
        ))}
      </div>
    ) : null}
    {action ? action : null}
  </div>
);

export const DashboardSidebar = ({
  badge,
  activeItem,
  showAdminIntegrationsLink = false,
  showApprovalsLink = true,
  footer,
}: {
  badge: ReactNode;
  activeItem: DashboardSidebarItemId;
  showAdminIntegrationsLink?: boolean;
  showApprovalsLink?: boolean;
  footer?: ReactNode;
}) => (
  <aside className="self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-sidebar)] p-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
    <div className="space-y-4">
      <div className="border-b border-[var(--color-border)] pb-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-base)]">
          OpenHands
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Context Layer</p>
          {badge}
        </div>
      </div>

      <nav className="space-y-1">
        {DASHBOARD_SECTION_ITEMS.filter(
          (item) => showApprovalsLink || item.id !== "caseByCaseApprovals",
        ).map((item) => (
          <DashboardSidebarLink
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
          />
        ))}
      </nav>

      {showAdminIntegrationsLink ? (
        <div className="border-t border-[var(--color-border)] pt-3">
          <DashboardSidebarLink
            href={ADMIN_INTEGRATIONS_ITEM.href}
            icon={ADMIN_INTEGRATIONS_ITEM.icon}
            label={ADMIN_INTEGRATIONS_ITEM.label}
            active={activeItem === ADMIN_INTEGRATIONS_ITEM.id}
          />
        </div>
      ) : null}

      {footer ? <div className="border-t border-[var(--color-border)] pt-3">{footer}</div> : null}
    </div>
  </aside>
);
