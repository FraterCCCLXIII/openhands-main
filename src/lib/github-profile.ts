interface GitHubProfile {
  id?: number | string | null;
  node_id?: string | null;
  sub?: string | null;
  login?: string | null;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

const getStableGitHubProfileId = (profile: GitHubProfile) => {
  if (profile.id !== undefined && profile.id !== null && profile.id !== "") {
    return profile.id.toString();
  }
  if (profile.node_id) {
    return profile.node_id;
  }
  if (profile.sub) {
    return profile.sub;
  }
  if (profile.login) {
    return `login:${profile.login}`;
  }
  if (profile.email) {
    return `email:${profile.email.toLowerCase()}`;
  }

  const responseKeys = Object.keys(profile).sort().join(", ") || "none";
  throw new Error(
    `GitHub OAuth profile response did not include a usable identifier. Response keys: ${responseKeys}.`,
  );
};

export const mapGitHubProfile = (profile: GitHubProfile) => ({
  id: getStableGitHubProfileId(profile),
  name: profile.name ?? profile.login ?? profile.email,
  email: profile.email,
  image: profile.avatar_url,
});
