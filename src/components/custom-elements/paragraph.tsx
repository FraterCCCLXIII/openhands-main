import clsx from "clsx";

interface ParagraphProps {
  bold?: boolean;
  italic?: boolean;
}

export function Paragraph({
  children,
  bold,
  italic,
}: React.PropsWithChildren<ParagraphProps>) {
  return (
    <p className={clsx(bold && "font-bold", italic && "italic")}>{children}</p>
  );
}
