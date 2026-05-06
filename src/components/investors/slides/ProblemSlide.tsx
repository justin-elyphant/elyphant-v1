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

      {/* Hero stat — gifting market */}
      <motion.div variants={itemVariants} className="text-center mb-4 md:mb-6">
        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
          $<AnimatedCounter value={242} duration={2} />B
        </div>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground/60">
          US personal gifting market — and gifting is broken
        </p>
      </motion.div>

      {/* Failure-rate callout */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col items-center gap-2 mb-4"
      >
        <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-xl px-4 sm:px-6 py-4">
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-400 mb-1">
            <AnimatedCounter value={30} duration={1.5} />%
          </div>
          <p className="text-white text-sm md:text-base font-medium text-center">
            of gifts are returned, regifted, or unwanted
          </p>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            ~2x the 15.8% general retail return rate
          </p>
        </div>

        <p className="text-muted-foreground text-xs md:text-sm mt-1">
          E-commerce gift returns spike to <span className="text-white font-semibold">25–30%</span> during holidays
        </p>
      </motion.div>

      {/* Bridge to solution */}
      <motion.p 
        variants={itemVariants}
        className="text-muted-foreground text-sm md:text-base italic mb-3 text-center max-w-xl"
      >
        A massive market with a structural failure rate — and no one has solved the data problem behind it.
      </motion.p>

      {/* Sources */}
      <motion.div
        variants={itemVariants}
        className="text-muted-foreground text-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
      >
        <span>Sources:</span>
        <a href="https://www.unitymarketingonline.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          Unity Marketing / Coresight <ExternalLink className="h-3 w-3" />
        </a>
        <a href="https://nrf.com/research/2025-retail-returns-landscape" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          NRF 2025 Returns <ExternalLink className="h-3 w-3" />
        </a>
        <a href="https://optoro.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          Optoro Returns Report <ExternalLink className="h-3 w-3" />
        </a>
      </motion.div>
    </SlideWrapper>
  );
};

export default ProblemSlide;
