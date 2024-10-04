import React from "react";
import { ExtraProps } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// See https://github.com/remarkjs/react-markdown?tab=readme-ov-file#use-custom-components-syntax-highlight

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
  const match = /language-(\w+)/.exec(className || ""); // get the language

  if (!match) {
    return <code className="bg-[rgb(30,30,30)] text-[rgb(212,212,212)] p-0.5 rounded">{children}</code>;
  }

  return (
    <SyntaxHighlighter
      customStyle={customStyle}
      className="rounded-lg"
      style={vscDarkPlus}
      language={match?.[1]}
      PreTag="div"
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
}
