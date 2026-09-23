import { H3 } from "#/ui/typography";

interface InstallerSectionProps {
  title: string;
  children: React.ReactNode;
}

export function InstallerSection({ title, children }: InstallerSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <H3>{title}</H3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
