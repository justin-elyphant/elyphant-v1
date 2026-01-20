import { motion } from 'framer-motion';
import { slideVariants, itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ProblemSlide = ({ direction }: SlideProps) => {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
    >
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-sm mb-8"
      >
        The Problem
      </motion.span>

      {/* Big stat */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-4">
          $<AnimatedCounter value={850} duration={2} />B
        </div>
        <p className="text-xl md:text-2xl text-gray-300">
          The US retail return crisis in 2025
        </p>
      </motion.div>

      {/* Holiday concentration callout */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col items-center gap-2 mb-6"
      >
        <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-2xl px-8 py-6">
          <div className="text-5xl md:text-6xl font-bold text-red-400 mb-2">
            $<AnimatedCounter value={168} duration={1.5} />B
          </div>
          <p className="text-white text-lg font-medium">concentrated in holiday season alone</p>
          <p className="text-gray-400 text-sm mt-1">20% of total returns in just 8 weeks</p>
        </div>
        
        {/* Supporting rate context */}
        <p className="text-gray-500 text-sm mt-2">
          Return rates spike from 15.8% → 17% during Nov-Jan
        </p>
      </motion.div>

      {/* Bridge to gifting */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-lg italic mb-6"
      >
        Wrong gifts are a leading contributor
      </motion.p>

      {/* Source */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-600 text-sm"
      >
        Source: National Retail Federation, October 2025
      </motion.p>
    </motion.div>
  );
};

export default ProblemSlide;
