import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";

/** The name shown as the feed's text logo. */
export const FEED_BRAND_NAME = "Tower";

/** Text logo at the top of the feed's left column: tall, all caps, links home. */
export function FeedWordmark() {
  const backendScopedPath = useBackendScopedPath();
  return (
    <NavigationLink
      to={backendScopedPath("/feed")}
      data-testid="feed-wordmark"
      className="mb-3 block px-2 font-tower text-5xl uppercase leading-none tracking-wider text-contrast"
    >
      {FEED_BRAND_NAME}
    </NavigationLink>
  );
}
