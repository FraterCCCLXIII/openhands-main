export const DEFAULT_CASE_BY_CASE_APPROVAL_HOURS = 4;
export const MAX_CASE_BY_CASE_APPROVAL_HOURS = 100;

export const DEFAULT_CASE_BY_CASE_APPROVAL_MINUTES =
  DEFAULT_CASE_BY_CASE_APPROVAL_HOURS * 60;
export const MAX_CASE_BY_CASE_APPROVAL_MINUTES =
  MAX_CASE_BY_CASE_APPROVAL_HOURS * 60;

export const normalizeApprovalDurationHours = (value: number) =>
  Math.min(Math.max(Math.round(value), 1), MAX_CASE_BY_CASE_APPROVAL_HOURS);

export const approvalHoursToMinutes = (hours: number) =>
  normalizeApprovalDurationHours(hours) * 60;

export const approvalStatusLabel = (status: string) => {
  switch (status) {
    case "rejected":
    case "expired":
      return "denied";
    default:
      return status;
  }
};
