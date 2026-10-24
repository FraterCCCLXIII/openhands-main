import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CopyableCommandField } from "#/components/shared/inputs/copyable-command-field";

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe("CopyableCommandField", () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  it("renders the label and command value", () => {
    render(
      <CopyableCommandField
        label="Command"
        value="npx -y @notionhq/notion-mcp-server"
        testId="test-field"
      />,
    );

    expect(screen.getByText("Command")).toBeInTheDocument();
    expect(
      screen.getByText("npx -y @notionhq/notion-mcp-server"),
    ).toBeInTheDocument();
  });

  it("shows a copy button", () => {
    render(
      <CopyableCommandField
        label="Command"
        value="npm install"
        testId="test-field"
      />,
    );

    expect(screen.getByTestId("copy-to-clipboard")).toBeInTheDocument();
  });

  it("copies text to clipboard when copy button is clicked", async () => {
    mockWriteText.mockResolvedValue(undefined);

    render(
      <CopyableCommandField
        label="Command"
        value="npm install package"
        testId="test-field"
      />,
    );

    const copyButton = screen.getByTestId("copy-to-clipboard");
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith("npm install package");
  });

  it("renders the command value in a code element for proper formatting", () => {
    render(
      <CopyableCommandField
        label="Command"
        value="npm run build"
        testId="test-field"
      />,
    );

    const codeElement = screen.getByTestId("test-field-value");
    expect(codeElement.tagName).toBe("CODE");
    expect(codeElement).toHaveClass("font-mono");
  });

  it("allows text selection with select-all class", () => {
    render(
      <CopyableCommandField
        label="Command"
        value="npm test"
        testId="test-field"
      />,
    );

    const codeElement = screen.getByTestId("test-field-value");
    expect(codeElement).toHaveClass("select-all");
  });
});
