import { cn } from "@/src/lib/utils";

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <section
    className={cn(
      "rounded-xl border border-[var(--oh-border)] bg-base-secondary",
      className,
    )}
  >
    {children}
  </section>
);
