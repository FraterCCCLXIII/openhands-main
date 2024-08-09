import React from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import AllHandsText from "./svgs/all-hands-text.svg?react";
import { getRandomLogo } from "~/utils/get-random-logo-variant";

const ANIMATE_DURATION = 1000;

interface AnimatedHeaderLogoProps {
  renderText?: boolean;
}

export const AnimatedHeaderLogo: React.FC<AnimatedHeaderLogoProps> = ({ renderText = true }) => {
  const Logo = React.useMemo(() => getRandomLogo(), []);

  return (
    <motion.div
      className="flex gap-2 items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIMATE_DURATION / 1000 }}
    >
      <LayoutGroup>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 35, duration: ANIMATE_DURATION / 1000 }}
        >
          <Logo width={39} height={26} />
        </motion.div>
        <AnimatePresence mode="popLayout">
          {renderText && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 70 }}
              transition={{ type: "spring", stiffness: 300, damping: 35, duration: ANIMATE_DURATION / 1000 }}
            >
              <AllHandsText width={126} height={21} />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </motion.div >
  );
};
