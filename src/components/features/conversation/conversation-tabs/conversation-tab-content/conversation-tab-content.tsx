import { lazy, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { TabWrapper } from "./tab-wrapper";
import { TabContainer } from "./tab-container";
import { TabContentArea } from "./tab-content-area";
import { ConversationTabContentCrossfade } from "./conversation-tab-content-crossfade";
import { useConversationStore } from "#/stores/conversation-store";
import { useConversationId } from "#/hooks/use-conversation-id";
import { CONVERSATION_TAB_LABEL_KEYS } from "../conversation-tab-ids";
import { ExtensionDrawerPage } from "#/components/features/canvas-extensions/extension-page-host";
import { useExtensionDrawerTabs } from "#/hooks/use-extension-drawer-tabs";
import { parseExtensionTabId } from "#/utils/extension-tab-id";

// Lazy load all tab components, including the terminal — xterm + addon-fit +
// xterm.css are large enough that we don't want them in the conversation
// route's eager graph just because the terminal tab might be selected later.
const FilesTab = lazy(() => import("#/routes/files-tab"));
const CommitsTab = lazy(() => import("#/routes/commits-tab"));
const BrowserTab = lazy(() => import("#/routes/browser-tab"));
const WebviewTab = lazy(() => import("#/routes/webview-tab"));
const PlannerTab = lazy(() => import("#/routes/planner-tab"));
const TaskListTab = lazy(() => import("#/routes/task-list-tab"));
const UsageTab = lazy(() => import("#/routes/usage-tab"));
const Terminal = lazy(() => import("#/components/features/terminal/terminal"));

const TAB_CONFIG = {
  tasklist: { component: TaskListTab },
  files: { component: FilesTab },
  commits: { component: CommitsTab },
  browser: { component: BrowserTab },
  webview: { component: WebviewTab },
  terminal: { component: Terminal },
  planner: { component: PlannerTab },
  usage: { component: UsageTab },
};

export function ConversationTabContent() {
  const { t } = useTranslation("openhands");
  const { selectedTab, shouldShownAgentLoading } = useConversationStore();
  const { conversationId } = useConversationId();

  const navigate = useNavigate();
  const extensionTabs = useExtensionDrawerTabs();
  const extensionTab = parseExtensionTabId(selectedTab);

  const activeTab = useMemo(
    () =>
      TAB_CONFIG[selectedTab as keyof typeof TAB_CONFIG] ?? TAB_CONFIG.files,
    [selectedTab],
  );

  const ActiveComponent = activeTab.component;
  const tabLabel = extensionTab
    ? (extensionTabs.find(({ tab }) => tab === selectedTab)?.label ??
      extensionTab.pageId)
    : t(
        CONVERSATION_TAB_LABEL_KEYS[
          (selectedTab ?? "files") as keyof typeof CONVERSATION_TAB_LABEL_KEYS
        ],
      );

  const tabWrapperKey =
    selectedTab === "terminal"
      ? `${selectedTab}-${conversationId}`
      : (selectedTab ?? "files");

  return (
    <TabContainer label={tabLabel}>
      <TabContentArea>
        <ConversationTabContentCrossfade
          showAgentLoading={shouldShownAgentLoading}
          tabKey={tabWrapperKey}
        >
          <TabWrapper key={tabWrapperKey}>
            {extensionTab ? (
              <ExtensionDrawerPage
                extensionName={extensionTab.extensionName}
                pageId={extensionTab.pageId}
                navigate={navigate}
              />
            ) : (
              <ActiveComponent />
            )}
          </TabWrapper>
        </ConversationTabContentCrossfade>
      </TabContentArea>
    </TabContainer>
  );
}
