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
          $<AnimatedCounter value={890} duration={2} />B
        </div>
        <p className="text-xl md:text-2xl text-gray-300">
          The US retail return crisis in 2024
        </p>
      </motion.div>

      {/* Supporting stat */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-8 py-6 mb-8"
      >
        <div className="text-4xl md:text-5xl font-bold text-red-400">
          17.6%
        </div>
        <div className="text-gray-400 text-left">
          <p className="font-semibold text-white">of all retail sales</p>
          <p>were returned last year</p>
        </div>
      </motion.div>

      {/* Source */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-600 text-sm"
      >
        Source: National Retail Federation & CNBC, 2024
      </motion.p>
    </motion.div>
  );
};

export default ProblemSlide;
