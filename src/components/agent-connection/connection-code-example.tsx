import { cn } from "@/src/lib/utils";
import { formControlSettingsFieldClassName } from "@/src/styles/form-control-classes";

interface ConnectionCodeExampleProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function ConnectionCodeExample({
  label,
  children,
  className,
}: ConnectionCodeExampleProps) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2.5", className)}>
      <span className="text-sm">{label}</span>
      <pre
        className={cn(
          formControlSettingsFieldClassName,
          "h-auto min-h-24 whitespace-pre-wrap py-3 font-mono text-xs leading-5 text-[var(--oh-text-dim)]",
        )}
      >
        {children}
      </pre>
    </div>
  );
}
