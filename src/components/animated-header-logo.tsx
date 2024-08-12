import React from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import AllHandsText from "~/svgs/brand/all-hands-text.svg?react";
import AllHandsLogo1 from "~/svgs/brand/all-hands-logo-1.svg?react";
import { getRandomLogo } from "~/utils/get-random-logo-variant";

const ANIMATE_DURATION = 1000;

interface AnimatedHeaderLogoProps {
  renderText?: boolean;
}

export const AnimatedHeaderLogo: React.FC<AnimatedHeaderLogoProps> = ({ renderText = true }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Logo = React.useMemo(() => getRandomLogo(), [renderText]); // get a random logo variant everytime user scrolls

  return (
    <div className="flex gap-2 items-center">
      <LayoutGroup>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 35, duration: ANIMATE_DURATION / 1000 }}
        >
          {!renderText && <Logo width={39} height={26} />}
          {renderText && <AllHandsLogo1 width={39} height={26} />}
        </motion.div>
        <AnimatePresence mode="popLayout" initial={false}>
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
    </div>
  );
};
