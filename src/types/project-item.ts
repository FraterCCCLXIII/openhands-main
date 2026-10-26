/**
 * Unified project item type for aggregating issues from multiple sources
 * (GitHub, Linear, Notion) into a single dashboard view.
 */

export type ProjectItemSource = "github" | "linear" | "notion" | "local";
export type ProjectItemPriority = "urgent" | "high" | "medium" | "low" | "none";
export type ProjectItemStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "cancelled";

export interface ProjectItemLabel {
  id: string;
  name: string;
  color?: string;
}

export interface ProjectItemAssignee {
  id: string;
  name: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export interface ProjectItemMention {
  id: string;
  name: string;
  type: "user" | "team";
}

export interface ProjectItem {
  /** Unique ID combining source and item ID, e.g. "github:123" or "linear:abc" */
  id: string;
  /** Source-specific ID */
  sourceId: string;
  /** Where this item came from */
  source: ProjectItemSource;
  /** Item title */
  title: string;
  /** Item description (markdown) */
  description?: string;
  /** Current status */
  status: ProjectItemStatus;
  /** Priority level */
  priority: ProjectItemPriority;
  /** Labels/tags */
  labels: ProjectItemLabel[];
  /** Assigned users */
  assignees: ProjectItemAssignee[];
  /** Users/teams @mentioned in this item */
  mentions: ProjectItemMention[];
  /** URL to the item in its source system */
  url?: string;
  /** Repository or project name */
  project?: string;
  /** Organization or workspace name */
  organization?: string;
  /** Item number (e.g., GitHub issue number) */
  number?: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Due date if set */
  dueDate?: string;
  /** Story points or estimate */
  estimate?: number;
  /** Linked OpenHands conversation ID if any */
  linkedConversationId?: string;
  /** Sprint or milestone name */
  sprint?: string;
  /** Parent item ID if this is a sub-item */
  parentId?: string;
}

/** Filter configuration for the projects dashboard */
export interface ProjectFilter {
  /** Filter by source */
  sources?: ProjectItemSource[];
  /** Filter by status */
  statuses?: ProjectItemStatus[];
  /** Filter by priority */
  priorities?: ProjectItemPriority[];
  /** Filter by label names */
  labels?: string[];
  /** Filter by project/repo names */
  projects?: string[];
  /** Only show items assigned to current user */
  assignedToMe?: boolean;
  /** Only show items where current user is @mentioned */
  mentionedMe?: boolean;
  /** Search query for title/description */
  searchQuery?: string;
  /** Show items due within N days */
  dueSoon?: number;
}

/** Predefined filter views */
export interface ProjectFilterView {
  id: string;
  name: string;
  icon?: string;
  filter: ProjectFilter;
  /** Is this a system default view or user-created? */
  isSystem?: boolean;
}

/** Default filter views for the dashboard */
export const DEFAULT_FILTER_VIEWS: ProjectFilterView[] = [
  {
    id: "my-work",
    name: "My Work",
    filter: { assignedToMe: true },
    isSystem: true,
  },
  {
    id: "mentioned",
    name: "@Mentioned",
    filter: { mentionedMe: true },
    isSystem: true,
  },
  {
    id: "product",
    name: "Product",
    filter: { labels: ["product", "feature", "enhancement"] },
    isSystem: true,
  },
  {
    id: "needs-design",
    name: "Needs Design",
    filter: { labels: ["needs-design", "design", "ux", "ui"] },
    isSystem: true,
  },
  {
    id: "bugs",
    name: "Bugs",
    filter: { labels: ["bug", "defect", "fix"] },
    isSystem: true,
  },
  {
    id: "urgent",
    name: "Urgent",
    filter: { priorities: ["urgent", "high"] },
    isSystem: true,
  },
  {
    id: "in-progress",
    name: "In Progress",
    filter: { statuses: ["in_progress", "review"] },
    isSystem: true,
  },
  {
    id: "due-soon",
    name: "Due Soon",
    filter: { dueSoon: 7 },
    isSystem: true,
  },
];
