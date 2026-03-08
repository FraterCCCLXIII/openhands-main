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
      "rounded-2xl border border-[var(--color-border)] bg-[color:rgba(31,34,40,0.92)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur",
      className,
    )}
  >
    {children}
  </section>
);
