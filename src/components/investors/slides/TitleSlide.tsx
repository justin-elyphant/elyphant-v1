import { motion } from 'framer-motion';
import { ChevronDown, Gift } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TitleSlide = ({ direction, onNext }: SlideProps) => {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
    >
      {/* Title with Gift Icon */}
      <motion.h1 
        variants={itemVariants}
        className="text-5xl md:text-7xl lg:text-8xl font-bold text-white text-center mb-6 flex items-center gap-4"
      >
        <Gift className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-sky-400" />
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
          Elyphant
        </span>
      </motion.h1>

      {/* Tagline */}
      <motion.p 
        variants={itemVariants}
        className="text-xl md:text-2xl lg:text-3xl text-gray-300 text-center max-w-3xl mb-12"
      >
        AI-Powered Gifting That Never Forgets
      </motion.p>

      {/* Subtitle */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-500 text-lg mb-16"
      >
        Investor Presentation • 2026
      </motion.p>

      {/* Scroll indicator */}
      <motion.button
        variants={itemVariants}
        onClick={onNext}
        className="absolute bottom-24 flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span className="text-sm">Begin</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
};

export default TitleSlide;
