import { cn } from "../utils/cn";
import { motion } from "framer-motion";

export const Card = ({ children, className, delay = 0, hoverEffect = true }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
    whileHover={hoverEffect ? { y: -4, scale: 1.01 } : {}}
    className={cn(
      "relative overflow-hidden rounded-2xl glass-card p-6 transition-colors duration-300",
      className
    )}
  >
    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
);