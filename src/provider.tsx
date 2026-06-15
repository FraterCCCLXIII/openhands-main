import React from 'react';

type PostHogClient = typeof import('posthog-js').default;
type PostHogProviderComponent = typeof import('posthog-js/react').PostHogProvider;

function runWhenIdle(callback: () => void) {
  if (typeof window === 'undefined') return undefined;

  const idleWindow = window as Window & typeof globalThis & {
    requestIdleCallback?: (handler: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const id = idleWindow.requestIdleCallback(callback, { timeout: 3000 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const id = globalThis.setTimeout(callback, 1500);
  return () => globalThis.clearTimeout(id);
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const [posthogClient, setPosthogClient] = React.useState<PostHogClient | null>(null);
  const [Provider, setProvider] = React.useState<PostHogProviderComponent | null>(null);

  React.useEffect(() => {
    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;

    if (!apiKey) {
      console.warn('PostHog API key not found. Analytics will not be initialized.');
      return;
    }

    let cancelled = false;
    const cancelIdle = runWhenIdle(() => {
      void Promise.all([import('posthog-js'), import('posthog-js/react')]).then(
        ([posthogModule, reactModule]) => {
          if (cancelled) return;

          const client = posthogModule.default;
          client.init(apiKey, {
            api_host: 'https://z.openhands.dev',
            ui_host: 'https://us.posthog.com',
            defaults: '2025-05-24',
          });

          setPosthogClient(client);
          setProvider(() => reactModule.PostHogProvider);
        },
      );
    });

    return () => {
      cancelled = true;
      cancelIdle?.();
    };
  }, []);

  if (posthogClient && Provider) {
    return <Provider client={posthogClient}>{children}</Provider>;
  }

  return <>{children}</>;
}
