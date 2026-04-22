import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ProblemSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-4 md:mb-6"
      >
        The Problem
      </motion.span>

      {/* Big stat */}
      <motion.div variants={itemVariants} className="text-center mb-4 md:mb-6">
        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
          $<AnimatedCounter value={850} duration={2} />B
        </div>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground/50">
          Estimated US retail returns in 2025
        </p>
      </motion.div>

      {/* Holiday concentration callout */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col items-center gap-2 mb-4"
      >
        <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 sm:px-6 py-4">
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-400 mb-1">
            $<AnimatedCounter value={168} duration={1.5} />B
          </div>
          <p className="text-white text-sm md:text-base font-medium text-center">estimated holiday-season return exposure</p>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">calculated from 20% of annual returns</p>
        </div>
        
        {/* Supporting rate context */}
        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          Retailers estimate a 15.8% annual return rate
        </p>
      </motion.div>

      {/* Bridge to gifting */}
      <motion.p 
        variants={itemVariants}
        className="text-muted-foreground text-sm md:text-base italic mb-3"
      >
        Wrong gifts are a leading contributor
      </motion.p>

      {/* Source */}
      <motion.p 
        variants={itemVariants}
        className="text-muted-foreground text-xs"
      >
        Source:{' '}
        <a href="https://nrf.com/research/2025-retail-returns-landscape" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          NRF 2025 Retail Returns Landscape <ExternalLink className="h-3 w-3" />
        </a>
      </motion.p>
    </SlideWrapper>
  );
};

export default ProblemSlide;
