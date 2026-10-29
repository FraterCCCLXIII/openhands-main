/** The agent prompt behind a feed card's "Commit changes" action. */
export const getGitCommitPrompt = (): string =>
  "Please commit the current changes in the repository with a clear, descriptive commit message. Do NOT push them.";
