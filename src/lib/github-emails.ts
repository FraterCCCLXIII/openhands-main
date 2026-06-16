export interface GitHubEmailRecord {
  email?: string | null;
  primary?: boolean | null;
  verified?: boolean | null;
}

export const selectPrimaryVerifiedGitHubEmail = (
  records: GitHubEmailRecord[],
): string | null => {
  const primaryVerified = records.find(
    (record) => record.primary && record.verified && record.email,
  );
  if (primaryVerified?.email) {
    return primaryVerified.email;
  }

  return records.find((record) => record.verified && record.email)?.email ?? null;
};

export const fetchPrimaryVerifiedGitHubEmail = async (
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> => {
  const response = await fetchImpl("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    return null;
  }

  const records = (await response.json()) as GitHubEmailRecord[];
  return selectPrimaryVerifiedGitHubEmail(records);
};
