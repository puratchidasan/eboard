import { cn } from "../utils/cn";
import { motion } from "framer-motion";

export const Button = ({ children, className, variant = "primary", isActive, ...props }) => {
  const baseClasses = "relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden backdrop-blur-md";

  const variants = {
    primary: "bg-indigo-500/80 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/50 hover:bg-indigo-400/80 hover:shadow-[0_0_25px_rgba(99,102,241,0.7)] hover:border-indigo-300",
    secondary: isActive
      ? "bg-purple-500/80 border border-purple-400/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
      : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:text-white"
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={cn(baseClasses, variants[variant], className)} 
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] hover:animate-[shimmer_1.5s_infinite]" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};
