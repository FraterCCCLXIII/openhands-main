import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReadObservationComponent } from "../../../src/components/share/trajectory-list-items/read-observation";

describe("ReadObservation", () => {
  const mockObservation = {
    id: 1,
    cause: 1,
    observation: "read" as const,
    message: "Reading file: /test/path",
    content: "Test file content",
    source: "agent" as const,
    timestamp: "2024-01-01T00:00:00.000Z",
    extras: {
      path: "/test/path"
    }
  };

  it("should render the read observation with path and content", () => {
    render(<ReadObservationComponent observation={mockObservation} />);
    
    expect(screen.getByText("/test/path")).toBeInTheDocument();
    expect(screen.getByText("Reading file:")).toBeInTheDocument();
    expect(screen.getByText("Test file content")).toBeInTheDocument();
  });

  it("should handle missing path", () => {
    const observationWithoutPath = {
      ...mockObservation,
      extras: {}
    };
    
    render(<ReadObservationComponent observation={observationWithoutPath} />);
    
    expect(screen.getByText("Reading file:")).toBeInTheDocument();
    expect(screen.getByText("Test file content")).toBeInTheDocument();
  });
});