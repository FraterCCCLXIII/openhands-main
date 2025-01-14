import React from "react";
import { ExtraProps } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodePropsType = React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps

interface CodeProps extends CodePropsType {
  customStyle?: React.CSSProperties
}

/**
 * Component to render code blocks in markdown.
 */
export function code({
  children,
  className,
  customStyle,
}: CodeProps) {
  const match = /language-(\w+)/.exec(className || "");

  const codeStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '20px',
    ...customStyle,
  };

  if (!match) {
    return <code className={className} style={codeStyle}>{children}</code>;
  }

  return (
    <SyntaxHighlighter
      customStyle={codeStyle}
      className="rounded-lg"
      style={vscDarkPlus}
      language={match?.[1]}
      PreTag="div"
      data-testid="syntax-highlighter"
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}
