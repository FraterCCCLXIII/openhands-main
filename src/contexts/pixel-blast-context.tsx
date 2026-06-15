import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type PixelBlastContextValue = {
  registerHost: (id: string, element: HTMLElement | null) => void;
  activeHost: HTMLElement | null;
  activeHostId: string | null;
};

const defaultPixelBlastContext: PixelBlastContextValue = {
  registerHost: () => {},
  activeHost: null,
  activeHostId: null,
};

const PixelBlastContext = createContext<PixelBlastContextValue>(defaultPixelBlastContext);

function pickActiveHostId(
  hosts: Map<string, HTMLElement>,
  ratios: Map<string, number>,
): string | null {
  let bestId: string | null = null;
  let bestRatio = 0;

  ratios.forEach((ratio, id) => {
    if (ratio > bestRatio && hosts.has(id)) {
      bestRatio = ratio;
      bestId = id;
    }
  });

  return bestId && bestRatio > 0 ? bestId : null;
}

export function PixelBlastProvider({ children }: { children: ReactNode }) {
  const hostsRef = useRef<Map<string, HTMLElement>>(new Map());
  const ratiosRef = useRef<Map<string, number>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [activeHostId, setActiveHostId] = useState<string | null>(null);

  const syncActiveHost = useCallback(() => {
    setActiveHostId(pickActiveHostId(hostsRef.current, ratiosRef.current));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-pixel-blast-host-id');
          if (id) {
            ratiosRef.current.set(id, entry.intersectionRatio);
          }
        }
        syncActiveHost();
      },
      { threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    observerRef.current = observer;
    hostsRef.current.forEach((element, id) => {
      element.setAttribute('data-pixel-blast-host-id', id);
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [syncActiveHost]);

  const registerHost = useCallback(
    (id: string, element: HTMLElement | null) => {
      const observer = observerRef.current;
      const previous = hostsRef.current.get(id);

      if (previous && observer) {
        observer.unobserve(previous);
      }

      if (!element) {
        hostsRef.current.delete(id);
        ratiosRef.current.delete(id);
        syncActiveHost();
        return;
      }

      element.setAttribute('data-pixel-blast-host-id', id);
      hostsRef.current.set(id, element);
      ratiosRef.current.set(id, 0);
      observer?.observe(element);
      syncActiveHost();
    },
    [syncActiveHost],
  );

  const activeHost = activeHostId ? (hostsRef.current.get(activeHostId) ?? null) : null;

  const value = useMemo(
    () => ({
      registerHost,
      activeHost,
      activeHostId,
    }),
    [registerHost, activeHost, activeHostId],
  );

  return <PixelBlastContext.Provider value={value}>{children}</PixelBlastContext.Provider>;
}

export function usePixelBlastContext(): PixelBlastContextValue {
  return useContext(PixelBlastContext);
}

/** Registers a pixel-blast host container for the shared WebGL renderer. */
export function usePixelBlastHostRegistration() {
  const { registerHost } = usePixelBlastContext();
  const hostId = useId();

  return useCallback(
    (element: HTMLElement | null) => {
      registerHost(hostId, element);
    },
    [registerHost, hostId],
  );
}
