/** Client-visible flag for design/UX review with static fixture data instead of a live API. */
export const isUxReviewMode = (): boolean =>
  process.env.NEXT_PUBLIC_UX_REVIEW_MODE === "true";
