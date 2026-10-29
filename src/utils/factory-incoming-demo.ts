export type IncomingSource = "linear" | "jira" | "github";
export type IncomingPriority = "urgent" | "high" | "medium" | "low";

export const INCOMING_SOURCES: readonly IncomingSource[] = [
  "linear",
  "jira",
  "github",
];

export interface IncomingItem {
  id: string;
  source: IncomingSource;
  /** The source's own reference: WEB-412, PLAT-88, #1204. */
  key: string;
  title: string;
  priority: IncomingPriority;
  reporter: string;
  /** Hours before now that it arrived. */
  hoursAgo: number;
}

interface Template {
  source: IncomingSource;
  title: string;
  priority: IncomingPriority;
  reporter: string;
}

const TEMPLATES: readonly Template[] = [
  {
    source: "linear",
    title: "Checkout button overlaps the footer on small screens",
    priority: "high",
    reporter: "Maya Chen",
  },
  {
    source: "github",
    title: "Dark mode flashes white on first load",
    priority: "medium",
    reporter: "jdoe",
  },
  {
    source: "jira",
    title: "Upgrade the design system to the new token format",
    priority: "low",
    reporter: "Priya Nair",
  },
  {
    source: "github",
    title: "Build fails on Node 22 when the cache is cold",
    priority: "urgent",
    reporter: "build-bot",
  },
  {
    source: "linear",
    title: "Add keyboard shortcuts to the command palette",
    priority: "medium",
    reporter: "Sam Ortiz",
  },
  {
    source: "jira",
    title: "Release notes missing for the last two frontend releases",
    priority: "low",
    reporter: "Lena Fox",
  },
  {
    source: "github",
    title: "Tooltip stays open after the trigger unmounts",
    priority: "high",
    reporter: "kwan",
  },
];

const PREFIX: Record<IncomingSource, string> = {
  linear: "WEB",
  jira: "PLAT",
  github: "#",
};

const hash = (text: string): number => {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) >>> 0;
  }
  return value;
};

/**
 * Sample work arriving from Linear, Jira and GitHub for one factory. Nothing
 * is fetched: the items are deterministic from the factory id until the
 * sources can be connected.
 */
export function getFactoryIncoming(factoryId: string): IncomingItem[] {
  const seed = hash(factoryId);
  return TEMPLATES.map((template, index) => {
    const number = 40 + ((seed + index * 37) % 900);
    return {
      id: `${factoryId}:${index}`,
      source: template.source,
      key:
        template.source === "github"
          ? `#${number}`
          : `${PREFIX[template.source]}-${number}`,
      title: template.title,
      priority: template.priority,
      reporter: template.reporter,
      hoursAgo: 1 + ((seed >> index) % 6) + index * 5,
    };
  });
}
