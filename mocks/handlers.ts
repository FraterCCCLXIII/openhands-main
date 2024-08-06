import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("https://api.github.com/repos/{owner}/{repo}/collaborators", () => {
    return HttpResponse.json({});
  }),
];
