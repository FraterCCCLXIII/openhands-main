export function FallbackCode({
  children,
  className,
  customStyle,
}: {
  children: React.ReactNode;
  className?: string;
  customStyle?: React.CSSProperties;
}) {
  return (
    <code className={className} style={customStyle}>
      {children}
    </code>
  );
}
