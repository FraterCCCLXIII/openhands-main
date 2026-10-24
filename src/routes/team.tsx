import React from "react";
import { useTranslation } from "react-i18next";
import {
  FolderGit2,
  GitBranch,
  ExternalLink,
  Mail,
  MessageSquare,
} from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { settingsLikeMainScrollClassName } from "#/utils/settings-like-page-layout-classes";
import { cn } from "#/utils/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email?: string;
  slack?: string;
  repos: {
    name: string;
    url: string;
    role: "owner" | "maintainer" | "contributor";
    branch?: string;
  }[];
  status: "active" | "away" | "offline";
  expertise: string[];
}

const MOCK_TEAM: TeamMember[] = [
  {
    id: "1",
    name: "Alice Chen",
    role: "Tech Lead",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    email: "alice@example.com",
    slack: "@alice",
    repos: [
      {
        name: "openhands-core",
        url: "https://github.com/OpenHands/OpenHands",
        role: "maintainer",
        branch: "main",
      },
      {
        name: "agent-sdk",
        url: "https://github.com/OpenHands/agent-sdk",
        role: "owner",
      },
    ],
    status: "active",
    expertise: ["Python", "AI/ML", "Architecture"],
  },
  {
    id: "2",
    name: "Bob Martinez",
    role: "Senior Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    email: "bob@example.com",
    slack: "@bob",
    repos: [
      {
        name: "openhands-core",
        url: "https://github.com/OpenHands/OpenHands",
        role: "contributor",
      },
      {
        name: "canvas-extensions",
        url: "https://github.com/OpenHands/extensions",
        role: "maintainer",
        branch: "dev",
      },
    ],
    status: "active",
    expertise: ["TypeScript", "React", "Canvas Apps"],
  },
  {
    id: "3",
    name: "Carol Williams",
    role: "Platform Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
    email: "carol@example.com",
    repos: [
      {
        name: "automation-runtime",
        url: "https://github.com/OpenHands/automation",
        role: "owner",
      },
      {
        name: "mcp-servers",
        url: "https://github.com/OpenHands/mcp-servers",
        role: "maintainer",
      },
    ],
    status: "away",
    expertise: ["Infrastructure", "Docker", "Kubernetes"],
  },
  {
    id: "4",
    name: "David Kim",
    role: "ML Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    slack: "@david.k",
    repos: [
      {
        name: "llm-providers",
        url: "https://github.com/OpenHands/llm-providers",
        role: "owner",
      },
      {
        name: "openhands-core",
        url: "https://github.com/OpenHands/OpenHands",
        role: "contributor",
        branch: "feature/new-models",
      },
    ],
    status: "active",
    expertise: ["LLMs", "Python", "Model Training"],
  },
  {
    id: "5",
    name: "Eva Johnson",
    role: "Frontend Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eva",
    email: "eva@example.com",
    slack: "@eva",
    repos: [
      {
        name: "canvas-ui",
        url: "https://github.com/OpenHands/canvas-ui",
        role: "maintainer",
      },
      {
        name: "design-system",
        url: "https://github.com/OpenHands/design-system",
        role: "owner",
      },
    ],
    status: "offline",
    expertise: ["React", "CSS", "Design Systems"],
  },
];

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  const colors = {
    active: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-500",
  };
  const labels = {
    active: "Active",
    away: "Away",
    offline: "Offline",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={cn("h-2 w-2 rounded-full", colors[status])} />
      {labels[status]}
    </span>
  );
}

function RoleBadge({ role }: { role: "owner" | "maintainer" | "contributor" }) {
  const colors = {
    owner: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    maintainer: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    contributor: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };
  return (
    <span
      className={cn(
        "text-xs px-1.5 py-0.5 rounded border uppercase tracking-wide font-medium",
        colors[role],
      )}
    >
      {role}
    </span>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const { t } = useTranslation("openhands");
  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-subtle transition-colors">
      <div className="flex items-start gap-4">
        <img
          src={member.avatar}
          alt={member.name}
          className="w-12 h-12 rounded-full bg-surface-raised"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground truncate">
              {member.name}
            </h3>
            <StatusBadge status={member.status} />
          </div>
          <p className="text-sm text-muted">{member.role}</p>

          <div className="flex items-center gap-3 mt-2">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="text-muted hover:text-foreground transition-colors"
                title={member.email}
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {member.slack && (
              <span className="text-xs text-muted">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                {member.slack}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {member.expertise.map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-0.5 rounded-full bg-surface-raised text-muted border border-border"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <FolderGit2 className="h-3.5 w-3.5" />
          {t(I18nKey.TEAM$REPO_CONNECTIONS)}
        </h4>
        <div className="space-y-2">
          {member.repos.map((repo) => (
            <div
              key={repo.name}
              className="flex items-center justify-between gap-2 text-sm bg-surface-raised rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent truncate flex items-center gap-1"
                >
                  {repo.name}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
                {repo.branch && (
                  <span className="text-xs text-muted flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {repo.branch}
                  </span>
                )}
              </div>
              <RoleBadge role={repo.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamPage() {
  const { t } = useTranslation("openhands");

  return (
    <div data-testid="team-page" className="flex h-full">
      <main className={cn(settingsLikeMainScrollClassName, "h-full flex-1")}>
        <div className="mx-auto flex w-full min-w-0 max-w-275 flex-col gap-6 p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-6 text-foreground">
              {t(I18nKey.TEAM$TITLE)}
            </h2>
            <p className="text-sm text-tertiary-light max-w-2xl">
              {t(I18nKey.TEAM$DESCRIPTION)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MOCK_TEAM.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeamPage;
