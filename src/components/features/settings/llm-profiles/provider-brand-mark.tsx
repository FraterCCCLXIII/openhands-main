import type { IconType } from "react-icons/lib";
import {
  SiAnthropic,
  SiCloudflare,
  SiDatabricks,
  SiGooglegemini,
  SiHuggingface,
  SiMistralai,
  SiOllama,
  SiOpenai,
  SiPerplexity,
  SiReplicate,
} from "react-icons/si";
import { AgentBrandIcon } from "#/components/shared/agent-brand-icon";
import { OTHER_PROVIDER_KEY } from "#/utils/llm-profile-provider";
import { mapProvider } from "#/utils/map-provider";

const PROVIDER_BRAND_MARKS: Record<string, IconType> = {
  anthropic: SiAnthropic,
  cloudflare: SiCloudflare,
  databricks: SiDatabricks,
  gemini: SiGooglegemini,
  huggingface: SiHuggingface,
  mistral: SiMistralai,
  ollama: SiOllama,
  openai: SiOpenai,
  perplexity: SiPerplexity,
  replicate: SiReplicate,
};

interface ProviderBrandMarkProps {
  providerId: string;
  size?: number;
}

/**
 * Brand mark for a provider id. Providers without a known mark render their
 * first letter in a rounded tile so every nav row keeps the same footprint.
 */
export function ProviderBrandMark({
  providerId,
  size = 16,
}: ProviderBrandMarkProps) {
  if (providerId === "openhands") {
    return <AgentBrandIcon kind="openhands" size={size} />;
  }

  const Icon = PROVIDER_BRAND_MARKS[providerId];
  if (Icon) {
    return <Icon size={size} aria-hidden />;
  }

  const letter =
    providerId === OTHER_PROVIDER_KEY
      ? "?"
      : mapProvider(providerId).charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded bg-interactive-hover-low text-xs font-semibold text-muted"
    >
      {letter}
    </span>
  );
}
