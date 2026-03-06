import React from 'react';

export const useWidth = (defaultWidth = 1024) => {
  const [width, setWidth] = React.useState(defaultWidth);

  React.useEffect(() => {
    // Set initial width on client
    setWidth(window.innerWidth);

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
