import { Feed } from "#/components/features/feed/feed";

function FeedScreen() {
  return (
    <div
      data-testid="feed-screen"
      className="h-full overflow-hidden rounded-xl bg-transparent"
    >
      <Feed />
    </div>
  );
}

export default FeedScreen;
