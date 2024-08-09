import { motion } from "framer-motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className }) => (
  <motion.section
    initial={{ y: 200 }}
    whileInView={{ y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className={className}
  >
    {children}
  </motion.section>
);
