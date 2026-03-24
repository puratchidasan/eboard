import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export const AnimatedCounter = ({ value, formatter = (v) => v.toFixed(0), className = "" }) => {
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const display = useTransform(spring, (current) => formatter(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
};
