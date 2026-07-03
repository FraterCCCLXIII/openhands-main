import { StatusPill } from "@/src/components/ui/status-pill";
import { cn } from "@/src/lib/utils";

interface PageHeaderProps {
  title: string;
  description: React.ReactNode;
  pills?: string[];
  pillsAccessory?: React.ReactNode;
  titleAccessory?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  pills,
  pillsAccessory,
  titleAccessory,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium leading-6 tracking-[-0.02em] text-white">
            {title}
          </h1>
          {titleAccessory}
        </div>
        <p
          data-testid="page-subtitle"
          className="text-sm leading-5 text-tertiary-light"
        >
          {description}
        </p>
        {pills?.length || pillsAccessory ? (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {pills?.length ? (
              <div className="flex flex-wrap gap-2">
                {pills.map((pill) => (
                  <StatusPill key={pill}>{pill}</StatusPill>
                ))}
              </div>
            ) : null}
            {pillsAccessory}
          </div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
