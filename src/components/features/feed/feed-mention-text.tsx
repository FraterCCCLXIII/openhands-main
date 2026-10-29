import { Fragment } from "react";

const MENTION_PATTERN = /(@\w+)/g;

/** Text with `@handle` tokens set apart so mentions read as links to people. */
export function FeedMentionText({ text }: { text: string }) {
  return (
    <>
      {text.split(MENTION_PATTERN).map((part, index) => {
        const key = `${index}-${part}`;
        return part.startsWith("@") ? (
          <span
            key={key}
            data-testid="feed-mention"
            className="font-medium text-sky-300"
          >
            {part}
          </span>
        ) : (
          <Fragment key={key}>{part}</Fragment>
        );
      })}
    </>
  );
}
