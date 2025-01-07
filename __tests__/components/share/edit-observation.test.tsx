import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EditObservationComponent } from "../../../src/components/share/trajectory-list-items/edit-observation";

describe("EditObservation", () => {
  const mockObservation = {
    id: 20,
    cause: 19,
    observation: "edit" as const,
    message: "File edited successfully",
    content: "<!DOCTYPE html>...",
    source: "agent" as const,
    timestamp: "2024-12-26T19:15:33.739498",
    extras: {
      path: "/workspace/OpenMemory/static/reader.html",
      old_content: "",
      new_content: "<!DOCTYPE html>...",
      command: "create",
      impl_source: "oh_aci"
    }
  };

  it("should render the edit observation with path and content", () => {
    render(<EditObservationComponent observation={mockObservation} />);
    
    expect(screen.getByText("/workspace/OpenMemory/static/reader.html")).toBeInTheDocument();
    expect(screen.getByText("Edited file:")).toBeInTheDocument();
    expect(screen.getByText("<!DOCTYPE html>...")).toBeInTheDocument();
  });

  it("should handle missing path", () => {
    const observationWithoutPath = {
      ...mockObservation,
      extras: {
        old_content: "Old test content",
        new_content: "New test content"
      }
    };
    
    render(<EditObservationComponent observation={observationWithoutPath} />);
    
    expect(screen.getByText("Edited file:")).toBeInTheDocument();
    expect(screen.getByText("Old test content")).toBeInTheDocument();
    expect(screen.getByText("New test content")).toBeInTheDocument();
  });

  it("should handle long content and show truncation message", () => {
    const longContent = "x".repeat(100001);
    const observationWithLongContent = {
      ...mockObservation,
      extras: {
        ...mockObservation.extras,
        old_content: longContent,
        new_content: longContent
      }
    };
    
    render(<EditObservationComponent observation={observationWithLongContent} />);
    
    expect(screen.getByText("Note: File content has been truncated for performance. Full content is available in the original file.")).toBeInTheDocument();
    expect(screen.getAllByText("[Content truncated due to size...]")).toHaveLength(2);
  });
});