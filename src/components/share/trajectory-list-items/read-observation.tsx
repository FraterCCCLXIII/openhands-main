import type { ReadObservation } from "../../../types";
import { TrajectoryCard } from "../trajectory-card";
import { code as Code } from "../../code";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";
import { useMemo } from "react";

interface ReadObservationProps {
  observation: ReadObservation;
}

const MAX_CONTENT_LENGTH = 100000; // ~100KB

const ReadObservationComponent = ({ observation }: ReadObservationProps) => {
  const path = observation.extras?.path ? String(observation.extras.path) : '';
  const rawContent = observation.content ? String(observation.content) : '';

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
    <TrajectoryCard className="bg-orange-200">
      <TrajectoryCard.Header className="bg-orange-400">Read Observation</TrajectoryCard.Header>
      <TrajectoryCard.Body>
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

export { ReadObservationComponent };