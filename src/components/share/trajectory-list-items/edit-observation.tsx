import { useMemo } from "react";
import type { EditObservation } from "../../../types";
import { TrajectoryCard } from "../trajectory-card";
import { code as Code } from "../../code";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";

interface EditObservationProps {
  observation: EditObservation;
}

const MAX_CONTENT_LENGTH = 100000; // ~100KB

const EditObservationComponent = ({ observation }: EditObservationProps) => {
  const path = observation.extras?.path ? String(observation.extras.path) : '';
  const oldContent = observation.extras?.old_content ? String(observation.extras.old_content) : '';
  const newContent = observation.extras?.new_content ? String(observation.extras.new_content) : 
                    observation.content ? String(observation.content) : '';

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
    <TrajectoryCard className="bg-orange-200">
      <TrajectoryCard.Header className="bg-orange-400">Edit Observation</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <div className="flex items-center gap-2 mb-2">
          <span>Edited file:</span>
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

export { EditObservationComponent };
