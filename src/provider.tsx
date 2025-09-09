import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
    
    if (!apiKey) {
      console.warn('PostHog API key not found. Analytics will not be initialized.');
      setHydrated(true);
      return;
    }

    posthog.init(apiKey, {
      api_host: 'https://us.i.posthog.com',
      defaults: '2025-05-24',
    });

    setHydrated(true);
  }, []);

  if (!hydrated) return <>{children}</>;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
