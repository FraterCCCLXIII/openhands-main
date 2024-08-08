import React from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import AllHandsText from "../svgs/all-hands-text.svg?react";
import AllHandsLogo from "../svgs/all-hands-1.svg?react";

const ANIMATE_DURATION = 1000;

export const AnimatedHeaderLogo = () => {
  const [textIsVisible, setTextIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setTextIsVisible(false);
    }, ANIMATE_DURATION * 2);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.div
      className="flex gap-2 items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIMATE_DURATION / 1000 }}
    >
      <LayoutGroup>
        <motion.div layout>
          <AllHandsLogo width={39} height={26} />
        </motion.div>
        <AnimatePresence>
          {textIsVisible && (
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
