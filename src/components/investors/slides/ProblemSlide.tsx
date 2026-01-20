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

      {/* Supporting stats */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row items-center gap-6 mb-6"
      >
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
          <div className="text-4xl md:text-5xl font-bold text-gray-400">
            15.8%
          </div>
          <div className="text-gray-400 text-left">
            <p className="font-semibold text-white">of total retail</p>
            <p>stores + online combined</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-5">
          <div className="text-4xl md:text-5xl font-bold text-red-400">
            17%
          </div>
          <div className="text-gray-400 text-left">
            <p className="font-semibold text-white">of holiday sales</p>
            <p>returned after gifting season</p>
          </div>
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
