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

      {/* Supporting stats with clear hierarchy */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row items-center gap-4 mb-6"
      >
        {/* Baseline stat */}
        <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
          <span className="text-xs uppercase tracking-widest text-gray-500 mb-2">Annual Baseline</span>
          <div className="text-4xl md:text-5xl font-bold text-gray-400">
            15.8%
          </div>
          <p className="text-gray-500 text-sm mt-1">all retail returns</p>
        </div>

        {/* Arrow indicator */}
        <div className="flex flex-col items-center text-red-400">
          <span className="text-2xl">→</span>
          <span className="text-xs uppercase tracking-wider">spikes to</span>
        </div>

        {/* Holiday spike stat */}
        <div className="flex flex-col items-center bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-4">
          <span className="text-xs uppercase tracking-widest text-red-400 mb-2">Holiday Season</span>
          <div className="text-4xl md:text-5xl font-bold text-red-400">
            17%
          </div>
          <p className="text-gray-400 text-sm mt-1">of holiday sales returned</p>
        </div>
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
