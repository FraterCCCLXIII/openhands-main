import React from 'react';
import { useRouteLoaderData } from 'react-router';
import type { clientLoader } from '~/root';

export const useWidth = (defaultWidth = 1024) => {
  const loaderData = useRouteLoaderData<typeof clientLoader>('root');

  const [width, setWidth] = React.useState(() => {
    return typeof window !== 'undefined'
      ? window.innerWidth
      : loaderData?.deviceWidth || defaultWidth;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const resize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return width;
};
