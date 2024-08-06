// TODO: Add error handling
// TODO: Use axios to simplify the code and token handling

export const fetchRepositoryContributors = async (owner: string, repo: string): Promise<Contributor[]> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors`, {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
    }
  });

  if (!response.ok) return [];
  return response.json();
}

export const fetchRepositoryStatistics = async (owner: string, repo: string): Promise<Repository> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
    }
  });

  if (!response.ok) {
    return { stargazers_count: 0 };
  }

  return response.json();
};

export const fetchBranch = async (owner: string, repo: string, branch: string): Promise<Branch> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
    }
  });

  if (!response.ok) {
    return { commit: { commit: { author: { date: "" } } } };
  }

  return response.json();
};
