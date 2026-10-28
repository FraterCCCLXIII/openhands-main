import { FeedProfile } from "#/components/features/feed/feed-profile";

function FeedProfileScreen() {
  return (
    <div
      data-testid="feed-profile-screen"
      className="h-full overflow-hidden rounded-xl bg-transparent"
    >
      <FeedProfile />
    </div>
  );
}

export default FeedProfileScreen;
