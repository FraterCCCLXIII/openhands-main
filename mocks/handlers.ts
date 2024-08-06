import { http, HttpResponse } from "msw";

const COLLABORATORS: Collaborator[] = Array.from({ length: 50 }, (_, index) => ({
  id: index,
  login: `collaborator-${index}`,
  node_id: `node-${index}`,
  avatar_url: `collaborator-${index}.png`,
}));

export const handlers = [
  http.get("https://api.github.com/repos/:owner/:repo/collaborators", () => {
    return HttpResponse.json(COLLABORATORS);
  }),
];
