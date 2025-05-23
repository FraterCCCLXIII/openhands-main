import React from 'react';

const LazyCSyntaxHighlighterModule = React.lazy(async () => {
  const module = await import('~/components/c-syntax-highlighter');
  return { default: module.CSyntaxHighlighter };
});

interface CSyntaxHighlighterProps {
  children: string;
  language?: string;
  className?: React.CSSProperties;
}

export const CSyntaxHighlighter: React.FC<CSyntaxHighlighterProps> = ({
  children,
  language,
  className,
}) => {
  return (
    <React.Suspense fallback={<code style={className}>{children}</code>}>
      <LazyCSyntaxHighlighterModule className={className} language={language}>
        {children}
      </LazyCSyntaxHighlighterModule>
    </React.Suspense>
  );
};
