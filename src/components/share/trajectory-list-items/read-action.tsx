import { useMemo } from "react";
import type { TrajectoryItem } from "../../../types";
import { TrajectoryCard } from "../trajectory-card";
import { code as Code } from "../../code";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";

interface ReadActionProps {
  item: TrajectoryItem;
}

const MAX_CONTENT_LENGTH = 100000; // ~100KB

const ReadActionComponent = ({ item }: ReadActionProps) => {
  const args = 'args' in item ? item.args : null;
  const extras = 'extras' in item ? item.extras : null;
  const path = args && 'path' in args ? String(args.path) : extras && 'path' in extras ? String(extras.path) : '';
  const thought = args && 'thought' in args ? String(args.thought) : '';
  const rawContent = 'content' in item ? String(item.content) : '';

  // Process content only once and only if it changes
  const { content, isTruncated } = useMemo(() => {
    if (rawContent.length > MAX_CONTENT_LENGTH) {
      return {
        content: rawContent.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to size...]',
        isTruncated: true
      };
    }
    return { content: rawContent, isTruncated: false };
  }, [rawContent]);

  return (
    <TrajectoryCard className="bg-green-200">
      <TrajectoryCard.Header className="bg-green-400">Read Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {thought && <p className="mb-2">{thought}</p>}
        <div className="flex items-center gap-2 mb-2">
          <span>Reading file:</span>
          <Code>{path}</Code>
        </div>
        {content && (
          <>
            <CSyntaxHighlighter language="plaintext">{content}</CSyntaxHighlighter>
            {isTruncated && (
              <p className="mt-2 text-sm text-gray-600">
                Note: File content has been truncated for performance. Full content is available in the original file.
              </p>
            )}
          </>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
}

export { ReadActionComponent };
