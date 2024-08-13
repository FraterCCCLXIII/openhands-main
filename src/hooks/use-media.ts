import React from "react";

export const useWidth = () => {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const resize = () => {
      setWidth(window.innerWidth);
    }

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    }
  }, []);

  return width;
};
