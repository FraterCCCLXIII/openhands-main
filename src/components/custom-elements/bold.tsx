import clsx from "clsx";

interface BoldProps {
  underline?: boolean;
}

export function Bold({
  children,
  underline,
}: React.PropsWithChildren<BoldProps>) {
  return <strong className={clsx(underline && "underline")}>{children}</strong>;
}
