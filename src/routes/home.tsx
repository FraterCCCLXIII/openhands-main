import { PrefetchPageLinks, useLocation } from "react-router";
import { HomeAppPromoCard } from "#/components/features/home/home-app-promo-card";
import { CustomerIntakeHost } from "#/components/features/customer-intake/customer-intake-modal";
import { HomeChatLauncher } from "#/components/features/home/home-chat-launcher";
import { LlmNotConfiguredBanner } from "#/components/features/home/llm-not-configured-banner";
import {
  isOnboardingPreviewActive,
  OnboardingHost,
} from "#/components/features/onboarding";

<PrefetchPageLinks page="/conversations/:conversationId" />;

function HomeScreen() {
  const location = useLocation();
  const isPreview = isOnboardingPreviewActive(location.search);

  return (
    <div className="relative h-full">
      <div
        data-testid="home-screen"
        className="custom-scrollbar-always h-full overflow-y-auto rounded-xl bg-transparent px-4 md:px-0 lg:px-10.5"
      >
        <div className="sticky top-0 z-10 bg-base pt-4 md:px-4 lg:px-0">
          <LlmNotConfiguredBanner />
        </div>

        <HomeChatLauncher />

        {!isPreview ? <OnboardingHost /> : null}
      </div>

      <div
        aria-hidden="true"
        data-testid="home-top-gradient"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-contrast/5 to-transparent"
      />

      <HomeAppPromoCard />
      {!isPreview ? <CustomerIntakeHost /> : null}
    </div>
  );
}

export default HomeScreen;
