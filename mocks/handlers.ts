import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("https://api.github.com/repos/:owner/:repo", () => {
    const REPOSITORY: Repository = {
      stargazers_count: 28000,
    };

    return HttpResponse.json(REPOSITORY);
  }),

  http.get("https://api.github.com/repos/:owner/:repo/contributors", ({ request }) => {
    const url = new URL(request.url);
    const count = url.searchParams.get("per_page") || 30;

    const CONTRIBUTORS: Contributor[] = Array.from({ length: Number(count) }, (_, index) => ({
      id: index,
      login: `contributor-${index}`,
      node_id: `node-${index}`,
      avatar_url: `contributor-${index}.png`,
    }));

    return HttpResponse.json(CONTRIBUTORS);
  }),

  http.get("https://api.github.com/repos/:owner/:repo/branches/:branch", () => {
    const BRANCH: Branch = {
      commit: {
        commit: {
          author: {
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        },
      },
    }

    return HttpResponse.json(BRANCH);
  }),
];
