import React from "react";
import { ExtraProps } from "react-markdown";
import { CopyableContentWrapper } from "#/components/shared/buttons/copyable-content-wrapper";
import { useColorTheme } from "#/hooks/use-color-theme";
import { getSyntaxHighlighterTheme } from "#/themes/syntax-highlighter-themes";
import { cn } from "#/utils/utils";
import {
  CHOICE_TEMPLATE_LANGUAGE,
  parseChoiceTemplate,
} from "#/utils/choice-template";
import { MultipleChoiceCard } from "./multiple-choice-card";
import { SyntaxHighlighter } from "./syntax-highlighter";
import {
  DECISION_LANGUAGE,
  DecisionCard,
  parseDecisionCard,
} from "./decision-card";

// See https://github.com/remarkjs/react-markdown?tab=readme-ov-file#use-custom-components-syntax-highlight

/**
 * Component to render code blocks in markdown.
 *
 * Named `Code` rather than lowercase like its sibling markdown components
 * because it calls a hook (`useColorTheme`), and `react-hooks/rules-of-hooks`
 * only treats capitalized functions as components. It is exported as `code`
 * so the `components` map in markdown-renderer reads like the others.
 */
function Code({
  children,
  className,
}: React.ClassAttributes<HTMLElement> &
  React.HTMLAttributes<HTMLElement> &
  ExtraProps) {
  const colorTheme = useColorTheme();
  const match = /language-(\w+)/.exec(className || ""); // get the language
  const language = match?.[1];
  const codeString = String(children).replace(/\n$/, "");

  // A well-formed `decision` block renders as an interactive card; anything
  // malformed falls through to a plain code block so the raw text stays visible.
  const decision =
    language === DECISION_LANGUAGE ? parseDecisionCard(codeString) : null;
  if (decision) {
    return <DecisionCard spec={decision} />;
  }

  if (!match) {
    const isMultiline = String(children).includes("\n");

    if (!isMultiline) {
      return (
        <code
          className={cn(
            className,
            "bg-surface-raised text-foreground border border-surface-raised rounded px-[0.4em] py-[0.2em]",
          )}
        >
          {children}
        </code>
      );
    }

    return (
      <CopyableContentWrapper text={codeString}>
        <pre className="bg-surface-raised text-foreground border border-surface-raised rounded p-[1em] overflow-auto">
          <code className={className}>{codeString}</code>
        </pre>
      </CopyableContentWrapper>
    );
  }

  if (language === CHOICE_TEMPLATE_LANGUAGE) {
    const template = parseChoiceTemplate(codeString);
    if (template) {
      return <MultipleChoiceCard template={template} />;
    }
  }

  return (
    <CopyableContentWrapper text={codeString} language={language}>
      <SyntaxHighlighter
        className="rounded-lg"
        style={getSyntaxHighlighterTheme(colorTheme)}
        language={language}
        PreTag="div"
      >
        {codeString}
      </SyntaxHighlighter>
    </CopyableContentWrapper>
  );
}

export { Code as code };
