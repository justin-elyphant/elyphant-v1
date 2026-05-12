import { motion } from 'framer-motion';
import { slideVariants } from '../slideAnimations';
import { cn } from '@/lib/utils';

interface SlideWrapperProps {
  children: React.ReactNode;
  direction: number;
  className?: string;
  contentClassName?: string;
  /**
   * Desktop-only flag. On mobile/tablet (<lg) every slide auto-scrolls vertically
   * to prevent clipping behind the iOS safe-area + nav controls.
   */
  verticalScroll?: boolean;
  /**
   * Vertically center content on mobile/tablet. Use for short hero slides
   * (Title, Welcome, Contact) where the content fits within the viewport.
   */
  centerOnMobile?: boolean;
}

/**
 * Standard slide wrapper.
 * - Mobile/tablet: always vertically scrollable, top-aligned, with safe-area
 *   padding so the slide counter / arrow controls never overlap content.
 * - Desktop (lg+): respects `verticalScroll`; otherwise center-aligned and
 *   overflow-hidden to preserve the 16:10 hero composition.
 */
const SlideWrapper = ({
  children,
  direction,
  className,
  contentClassName,
  verticalScroll = false,
}: SlideWrapperProps) => (
  <motion.div
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    custom={direction}
    style={{
      // Reserve room for the bottom nav arrows + iOS home indicator on mobile.
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
    }}
    className={cn(
      "absolute inset-0 flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 pt-6 md:pt-8",
      // Mobile/tablet: always scroll, top-aligned
      "overflow-y-auto justify-start",
      // Desktop: restore centered/clipped composition unless the slide opts in to scroll
      verticalScroll
        ? "lg:overflow-y-auto lg:justify-start lg:pb-8"
        : "lg:overflow-hidden lg:justify-center lg:pb-8",
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
