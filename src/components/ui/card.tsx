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
      "rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-workspace)]",
      className,
    )}
  >
    {children}
  </section>
);
