interface ExternalLinkProps {
  label?: string;
}

export function ExternalLink({ children, label }: React.PropsWithChildren<ExternalLinkProps>) {
  return (
    <a
      href={children?.toString()}
      target="_blank"
      rel="noreferrer noopener"
      className="underline underline-offset-2 text-blue-600 hover:text-blue-800"
    >
      {label || children}
    </a>
  );
}
