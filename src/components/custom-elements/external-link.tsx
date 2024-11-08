interface ExternalLinkProps {
  label?: string;
}

export function ExternalLink({ children, label }: React.PropsWithChildren<ExternalLinkProps>) {
  return (
    <a
      href={children?.toString()}
      target="_blank"
      rel="noreferrer"
      className="underline"
    >
      {label || children}
    </a>
  );
}
