import { Variants } from 'framer-motion';

export const slideVariants: Variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
    transition: {
      y: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.4 },
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -100 : 100,
    opacity: 0,
    transition: {
      y: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 },
    },
  }),
};

export const itemVariants: Variants = {
  enter: {
    y: 20,
    opacity: 0,
  },
  center: {
    y: 0,
    opacity: 1,
    transition: {
      y: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.4 },
    },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  },
};

export const scaleInVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  },
};
