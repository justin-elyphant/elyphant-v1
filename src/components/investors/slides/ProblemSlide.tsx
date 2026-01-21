import { motion } from 'framer-motion';
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
        <p className="text-base sm:text-lg md:text-xl text-gray-300">
          The US retail return crisis in 2025
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
          <p className="text-white text-sm md:text-base font-medium text-center">concentrated in holiday season alone</p>
          <p className="text-gray-400 text-xs md:text-sm mt-1">20% of total returns in just 8 weeks</p>
        </div>
        
        {/* Supporting rate context */}
        <p className="text-gray-500 text-xs md:text-sm mt-1">
          Return rates spike from 15.8% → 17% during Nov-Jan
        </p>
      </motion.div>

      {/* Bridge to gifting */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-sm md:text-base italic mb-3"
      >
        Wrong gifts are a leading contributor
      </motion.p>

      {/* Source */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-600 text-xs"
      >
        Source: National Retail Federation, October 2025
      </motion.p>
    </SlideWrapper>
  );
};

export default ProblemSlide;
