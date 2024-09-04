import { motion } from "framer-motion";

interface AnimatedListItemProps {
  children: React.ReactNode;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ children }) => (
  <motion.li
    whileHover={{ scale: 1.1 }}
    className="text-white font-quincy text-[41px] leading-[42px]"
  >
    {children}
  </motion.li>
);
