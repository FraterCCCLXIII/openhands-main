import React from 'react';
import {
  DEFAULT_HOME_VARIANT,
  type HomeVariantId,
  readStoredHomeVariant,
  writeStoredHomeVariant,
} from '~/constants/home-variants';

type HomeVariantContextValue = {
  variant: HomeVariantId;
  setVariant: (variant: HomeVariantId) => void;
};

const HomeVariantContext = React.createContext<HomeVariantContextValue | null>(null);

export function HomeVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = React.useState<HomeVariantId>(DEFAULT_HOME_VARIANT);

  React.useEffect(() => {
    setVariantState(readStoredHomeVariant());
  }, []);

  const setVariant = React.useCallback((nextVariant: HomeVariantId) => {
    setVariantState(nextVariant);
    writeStoredHomeVariant(nextVariant);
  }, []);

  const value = React.useMemo(
    () => ({
      variant,
      setVariant,
    }),
    [variant, setVariant],
  );

  return <HomeVariantContext.Provider value={value}>{children}</HomeVariantContext.Provider>;
}

export function useHomeVariant() {
  const context = React.useContext(HomeVariantContext);
  if (!context) {
    return {
      variant: DEFAULT_HOME_VARIANT,
      setVariant: () => {},
    };
  }
  return context;
}
