import React from "react";
import { CopyToClipboardButton } from "./copy-to-clipboard-button";
import { RunCommandButton } from "./run-command-button";
import { useSendMessage } from "#/hooks/use-send-message";

const SHELL_LANGUAGES = new Set([
  "bash",
  "sh",
  "shell",
  "zsh",
  "fish",
  "powershell",
  "cmd",
  "terminal",
]);

function isShellCommand(text: string, language?: string): boolean {
  if (language && SHELL_LANGUAGES.has(language.toLowerCase())) {
    return true;
  }
  // Heuristic: single-line commands starting with common CLI patterns
  const trimmed = text.trim();
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length > 5) return false; // Too many lines, probably not a simple command

  const commandPatterns = [
    /^(npm|yarn|pnpm|bun)\s+/,
    /^(pip|uv|poetry)\s+/,
    /^(git|gh)\s+/,
    /^(docker|podman)\s+/,
    /^(curl|wget|fetch)\s+/,
    /^(cd|ls|cat|echo|mkdir|rm|cp|mv|chmod|chown)\s+/,
    /^(open|code|vim|nano)\s+/,
    /^(make|cmake)\s+/,
    /^(cargo|rustc)\s+/,
    /^(go|python|node|ruby|java)\s+/,
    /^\.\//,
    /^\$/,
  ];

  return commandPatterns.some((pattern) => pattern.test(trimmed));
}

export function CopyableContentWrapper({
  text,
  language,
  children,
}: {
  text: string;
  language?: string;
  children: React.ReactNode;
}) {
  const [isHovering, setIsHovering] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [runState, setRunState] = React.useState<"run" | "running" | "done">(
    "run",
  );

  const { send } = useSendMessage();
  const showRunButton = isShellCommand(text, language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
  };

  const handleRun = async () => {
    if (runState !== "run") return;

    setRunState("running");

    // Send command to agent via chat
    const command = text.trim();
    await send({
      action: "message",
      args: {
        content: `Run this command:\n\`\`\`bash\n${command}\n\`\`\``,
      },
    });

    // Show done state briefly, then reset
    setTimeout(() => {
      setRunState("done");
      setTimeout(() => setRunState("run"), 2000);
    }, 500);
  };

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCopied]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {showRunButton && (
          <RunCommandButton
            isHidden={!isHovering}
            isDisabled={runState === "running"}
            onClick={handleRun}
            mode={runState}
          />
        )}
        <CopyToClipboardButton
          isHidden={!isHovering}
          isDisabled={isCopied}
          onClick={handleCopy}
          mode={isCopied ? "copied" : "copy"}
        />
      </div>
      {children}
    </div>
  );
}
