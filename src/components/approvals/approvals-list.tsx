import type { AccessRequest } from "@/src/types/integrations-hub";
import { ApprovalRequestRow } from "@/src/components/approvals/approval-request-row";
import {
  APPROVALS_PAGE_COPY,
  type ApprovalStatusFilter,
} from "@/src/constants/approvals-page";
import { cn } from "@/src/lib/utils";
import {
  settingsListContainerClassName,
  settingsListTableHeadClassName,
  settingsListTableHeaderCellClassName,
} from "@/src/styles/settings-list-classes";

interface ApprovalsListProps {
  requests: AccessRequest[];
  approvalFilter: ApprovalStatusFilter;
  selectedRequests: Record<string, boolean>;
  showSelection?: boolean;
  showRowActions?: boolean;
  requestActionPending: boolean;
  onToggleSelected: (requestId: string, selected: boolean) => void;
  onApproveRequest?: (requestId: string) => void;
  onDenyRequest?: (requestId: string) => void;
}

const approvalsTableHeaderCellClassName = cn(
  settingsListTableHeaderCellClassName,
  "whitespace-nowrap text-xs font-medium text-tertiary-light",
);

export function ApprovalsList({
  requests,
  approvalFilter,
  selectedRequests,
  showSelection = true,
  showRowActions = false,
  requestActionPending,
  onToggleSelected,
  onApproveRequest,
  onDenyRequest,
}: ApprovalsListProps) {
  const showSelectionColumn = showSelection && approvalFilter === "pending";
  const showDecisionColumns = approvalFilter !== "pending";
  const showActionsColumn = showRowActions;
  const showConversationColumn = requests.some(
    (request) => request.agentData?.conversationLink,
  );

  return (
    <div data-testid="approvals-list" className={settingsListContainerClassName}>
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          {showSelectionColumn ? <col className="w-10" /> : null}
          <col className="w-[32%]" />
          <col className="w-[16%]" />
          {showConversationColumn ? <col className="w-[12%]" /> : null}
          <col className="w-[5.75rem]" />
          <col className="w-14" />
          {showDecisionColumns ? (
            <>
              <col className="w-[14%]" />
              <col className="w-[5.75rem]" />
            </>
          ) : null}
          <col className="w-[10%]" />
          {showActionsColumn ? <col className="w-16" /> : null}
        </colgroup>
        <thead className={settingsListTableHeadClassName}>
          <tr>
            {showSelectionColumn ? (
              <th scope="col" className={cn(approvalsTableHeaderCellClassName, "w-10 pl-4 pr-2")}>
                <span className="sr-only">
                  {APPROVALS_PAGE_COPY.tableColumnSelect}
                </span>
              </th>
            ) : null}
            <th
              scope="col"
              className={cn(
                approvalsTableHeaderCellClassName,
                showSelectionColumn ? "px-2" : "pl-4 pr-2",
              )}
            >
              {APPROVALS_PAGE_COPY.tableColumnTool}
            </th>
            <th scope="col" className={approvalsTableHeaderCellClassName}>
              {APPROVALS_PAGE_COPY.tableColumnInvocationIdentity}
            </th>
            {showConversationColumn ? (
              <th scope="col" className={approvalsTableHeaderCellClassName}>
                {APPROVALS_PAGE_COPY.tableColumnConversation}
              </th>
            ) : null}
            <th scope="col" className={approvalsTableHeaderCellClassName}>
              {APPROVALS_PAGE_COPY.tableColumnRequested}
            </th>
            <th scope="col" className={approvalsTableHeaderCellClassName}>
              {APPROVALS_PAGE_COPY.tableColumnRequestedDuration}
            </th>
            {showDecisionColumns ? (
              <>
                <th scope="col" className={approvalsTableHeaderCellClassName}>
                  {APPROVALS_PAGE_COPY.tableColumnDecidedBy}
                </th>
                <th scope="col" className={approvalsTableHeaderCellClassName}>
                  {APPROVALS_PAGE_COPY.tableColumnDecidedAt}
                </th>
              </>
            ) : null}
            <th scope="col" className={approvalsTableHeaderCellClassName}>
              {APPROVALS_PAGE_COPY.tableColumnScopes}
            </th>
            {showActionsColumn ? (
              <th scope="col" className={cn(approvalsTableHeaderCellClassName, "w-16")}>
                <span className="sr-only">
                  {APPROVALS_PAGE_COPY.tableColumnActions}
                </span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--oh-border)]">
          {requests.map((request) => (
            <ApprovalRequestRow
              key={request.id}
              request={request}
              isSelected={Boolean(selectedRequests[request.id])}
              showSelectionColumn={showSelectionColumn}
              showDecisionColumns={showDecisionColumns}
              showActionsColumn={showActionsColumn}
              showConversationColumn={showConversationColumn}
              requestActionPending={requestActionPending}
              onToggleSelected={onToggleSelected}
              onApprove={onApproveRequest}
              onDeny={onDenyRequest}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
