import { motion } from 'framer-motion';
import { slideVariants } from '../slideAnimations';
import { cn } from '@/lib/utils';

interface SlideWrapperProps {
  children: React.ReactNode;
  direction: number;
  className?: string;
  contentClassName?: string;
  verticalScroll?: boolean;
}

/**
 * Standard-view-first slide wrapper with consistent constraints.
 * All slides use this wrapper for unified layout behavior.
 */
const SlideWrapper = ({ 
  children, 
  direction, 
  className,
  contentClassName,
  verticalScroll = false 
}: SlideWrapperProps) => (
  <motion.div
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    custom={direction}
    className={cn(
      "absolute inset-0 flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 py-6 md:py-8",
      verticalScroll ? "overflow-y-auto justify-start" : "justify-center overflow-hidden",
      className
    )}
  >
    <div className={cn(
      "w-full max-w-4xl mx-auto flex flex-col items-center",
      contentClassName
    )}>
      {children}
    </div>
  </motion.div>
);

export default SlideWrapper;
