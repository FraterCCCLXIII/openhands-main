import { useMemo } from "react";
import type { TrajectoryItem } from "../../../types";
import { TrajectoryCard } from "../trajectory-card";
import { code as Code } from "../../code";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";

interface EditActionProps {
  item: TrajectoryItem;
}

const MAX_CONTENT_LENGTH = 100000; // ~100KB

const EditActionComponent = ({ item }: EditActionProps) => {
  const args = 'args' in item ? item.args : null;
  const path = args && 'path' in args ? String(args.path) : '';
  const thought = args && 'thought' in args ? String(args.thought) : '';
  const oldContent = args && 'old_content' in args ? String(args.old_content) : 
                  args && 'content' in args ? String(args.content) : '';
  const newContent = args && 'new_content' in args ? String(args.new_content) : 
                    args && 'translated_ipython_code' in args ? String(args.translated_ipython_code) : '';

  // Process content only once and only if it changes
  const { truncatedOldContent, truncatedNewContent, isTruncated } = useMemo(() => {
    const isOldContentLong = oldContent.length > MAX_CONTENT_LENGTH;
    const isNewContentLong = newContent.length > MAX_CONTENT_LENGTH;

    return {
      truncatedOldContent: isOldContentLong 
        ? oldContent.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to size...]'
        : oldContent,
      truncatedNewContent: isNewContentLong
        ? newContent.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to size...]'
        : newContent,
      isTruncated: isOldContentLong || isNewContentLong
    };
  }, [oldContent, newContent]);

  return (
    <TrajectoryCard className="bg-green-200">
      <TrajectoryCard.Header className="bg-green-400">Edit Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {thought && <p className="mb-2">{thought}</p>}
        <div className="flex items-center gap-2 mb-2">
          <span>Editing file:</span>
          <Code>{path}</Code>
        </div>
        {oldContent && (
          <div className="mb-4">
            <p className="mb-2 font-medium">Old content:</p>
            <CSyntaxHighlighter language="plaintext">{truncatedOldContent}</CSyntaxHighlighter>
          </div>
        )}
        {newContent && (
          <div>
            <p className="mb-2 font-medium">New content:</p>
            <CSyntaxHighlighter language="plaintext">{truncatedNewContent}</CSyntaxHighlighter>
          </div>
        )}
        {isTruncated && (
          <p className="mt-2 text-sm text-gray-600">
            Note: File content has been truncated for performance. Full content is available in the original file.
          </p>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
}

export { EditActionComponent };
