import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EditActionComponent } from "../../../src/components/share/trajectory-list-items/edit-action";

describe("EditActionComponent", () => {
  const mockItem = {
    id: 19,
    action: "edit" as const,
    message: "",
    source: "agent" as const,
    timestamp: "2024-12-26T19:15:33.739498",
    args: {
      content: "",
      end: -1,
      impl_source: "oh_aci",
      path: "/workspace/OpenMemory/static/reader.html",
      start: 1,
      thought: "Now I'll create a new reader.html file with the same styling and structure as the other pages:",
      translated_ipython_code: "print(file_editor(**{'command': 'create', 'path': '/workspace/OpenMemory/static/reader.html', 'file_text': '<!DOCTYPE html>...'}))"
    },
    tool_call_metadata: {
      function_name: "str_replace_editor",
      model_response: {
        choices: [{
          message: {
            content: "Now I'll create a new reader.html file with the same styling and structure as the other pages:",
            tool_calls: [{
              function: {
                arguments: "{\"command\": \"create\", \"path\": \"/workspace/OpenMemory/static/reader.html\", \"file_text\": \"<!DOCTYPE html>...\"}"
              }
            }]
          }
        }]
      }
    }
  };

  it("should render the edit action with path and thought", () => {
    render(<EditActionComponent item={mockItem} />);
    
    expect(screen.getByText("/workspace/OpenMemory/static/reader.html")).toBeInTheDocument();
    expect(screen.getByText("Editing file:")).toBeInTheDocument();
    expect(screen.getByText("Now I'll create a new reader.html file with the same styling and structure as the other pages:")).toBeInTheDocument();
  });

  it("should render the edit action with thought", () => {
    const itemWithThought = {
      ...mockItem,
      args: {
        ...mockItem.args,
        thought: "Test thought"
      }
    };
    
    render(<EditActionComponent item={itemWithThought} />);
    
    expect(screen.getByText("Test thought")).toBeInTheDocument();
    expect(screen.getByText("/workspace/OpenMemory/static/reader.html")).toBeInTheDocument();
    expect(screen.getByText("Editing file:")).toBeInTheDocument();
  });

  it("should handle long content and show truncation message", () => {
    const longContent = "x".repeat(100001);
    const itemWithLongContent = {
      ...mockItem,
      args: {
        ...mockItem.args,
        old_content: longContent,
        new_content: longContent
      }
    };
    
    render(<EditActionComponent item={itemWithLongContent} />);
    
    expect(screen.getByText("Note: File content has been truncated for performance. Full content is available in the original file.")).toBeInTheDocument();
    expect(screen.getAllByText("[Content truncated due to size...]")).toHaveLength(2);
  });
});