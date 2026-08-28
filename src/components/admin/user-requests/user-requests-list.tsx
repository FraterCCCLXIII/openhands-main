import { UserRequestRow } from "@/src/components/admin/user-requests/user-request-row";
import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { cn } from "@/src/lib/utils";
import {
  settingsListContainerClassName,
  settingsListTableHeadClassName,
  settingsListTableHeaderCellClassName,
} from "@/src/styles/settings-list-classes";
import type { IntegrationRequest } from "@/src/types/integrations-hub";

const copy = HUB_PAGE_COPY.adminUserRequests;

const headerCellClassName = cn(
  settingsListTableHeaderCellClassName,
  "text-xs font-medium text-tertiary-light whitespace-normal",
);

interface UserRequestsListProps {
  requests: IntegrationRequest[];
  actionPending: boolean;
  onAdd: (request: IntegrationRequest) => void;
  onDismiss: (requestId: string) => void;
}

export function UserRequestsList({
  requests,
  actionPending,
  onAdd,
  onDismiss,
}: UserRequestsListProps) {
  return (
    <div data-testid="user-requests-list" className={settingsListContainerClassName}>
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[32%]" />
          <col className="w-[24%]" />
          <col className="w-[108px]" />
          <col className="w-16" />
          <col className="w-[148px]" />
        </colgroup>
        <thead className={settingsListTableHeadClassName}>
          <tr>
            <th scope="col" className={cn(headerCellClassName, "pl-4")}>
              {copy.tableColumnIntegration}
            </th>
            <th scope="col" className={headerCellClassName}>
              {copy.tableColumnRequestedBy}
            </th>
            <th scope="col" className={headerCellClassName}>
              {copy.tableColumnRequested}
            </th>
            <th scope="col" className={headerCellClassName}>
              {copy.tableColumnNotes}
            </th>
            <th scope="col" className={cn(headerCellClassName, "pr-4")}>
              <span className="sr-only">{copy.tableColumnActions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--oh-border)]">
          {requests.map((request) => (
            <UserRequestRow
              key={request.id}
              request={request}
              actionPending={actionPending}
              onAdd={onAdd}
              onDismiss={onDismiss}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
