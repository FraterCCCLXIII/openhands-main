import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReadActionComponent } from "../../../src/components/share/trajectory-list-items/read-action";

describe("ReadActionComponent", () => {
  const mockItem = {
    id: 1,
    cause: 1,
    observation: "read",
    message: "Reading file: /test/path",
    content: "Test file content",
    source: "agent",
    timestamp: "2024-01-01T00:00:00.000Z",
    extras: {
      path: "/test/path"
    }
  };

  it("should render the read action with path and content", () => {
    render(<ReadActionComponent item={mockItem} />);
    
    expect(screen.getByText("/test/path")).toBeInTheDocument();
    expect(screen.getByText("Reading file:")).toBeInTheDocument();
    expect(screen.getByText("Test file content")).toBeInTheDocument();
  });

  it("should render the read action with thought", () => {
    const itemWithThought = {
      action: "read",
      args: {
        path: "/test/path",
        thought: "Test thought"
      },
      id: 1,
      message: "Reading file: /test/path",
      source: "agent",
      timestamp: "2024-01-01T00:00:00.000Z"
    };
    
    render(<ReadActionComponent item={itemWithThought} />);
    
    expect(screen.getByText("Test thought")).toBeInTheDocument();
    expect(screen.getByText("/test/path")).toBeInTheDocument();
    expect(screen.getByText("Reading file:")).toBeInTheDocument();
  });
});
