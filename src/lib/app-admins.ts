const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const getAppAdminEmails = (raw = process.env.APP_ADMIN_EMAILS ?? "") =>
  raw
    .split(/[\n,]/)
    .map((value) => normalizeEmail(value))
    .filter(Boolean);

export const isAppAdminEmail = (
  email: string | null | undefined,
  adminEmails = getAppAdminEmails(),
) => {
  if (!email) {
    return false;
  }

  return adminEmails.includes(normalizeEmail(email));
};
