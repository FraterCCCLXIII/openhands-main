import React from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import AllHandsText from "../svgs/all-hands-text.svg?react";
import { getRandomLogo } from "~/utils/get-random-logo-variant";

const ANIMATE_DURATION = 1000;

interface AnimatedHeaderLogoProps {
  renderText?: boolean;
}

export const AnimatedHeaderLogo = ({ renderText = true }) => {
  const [textIsVisible, setTextIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setTextIsVisible(false);
    }, ANIMATE_DURATION * 2);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const Logo = React.useMemo(() => getRandomLogo(), []);

  return (
    <motion.div
      className="flex gap-2 items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIMATE_DURATION / 1000 }}
    >
      <LayoutGroup>
        <motion.div layout>
          <Logo width={39} height={26} />
        </motion.div>
        <AnimatePresence>
          {renderText && textIsVisible && (
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIMATE_DURATION / 1000 }}
            >
              <AllHandsText width={126} height={21} />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </motion.div >
  );
};
