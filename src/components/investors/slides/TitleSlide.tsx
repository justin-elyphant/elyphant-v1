import { motion } from 'framer-motion';
import { ChevronDown, Gift } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TitleSlide = ({ direction, onNext }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Title with Gift Icon */}
      <motion.h1 
        variants={itemVariants}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2 sm:gap-3 md:gap-4"
      >
        <Gift className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-sky-400 flex-shrink-0" />
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
          Elyphant
        </span>
      </motion.h1>

      {/* Tagline */}
      <motion.p 
        variants={itemVariants}
        className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 text-center max-w-2xl mb-6 md:mb-8"
      >
        Connecting Through AI-Powered Gifting
      </motion.p>

      {/* Subtitle */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-500 text-sm md:text-base mb-8 md:mb-10"
      >
        Investor Presentation • 2026
      </motion.p>

      {/* Scroll indicator */}
      <motion.button
        variants={itemVariants}
        onClick={onNext}
        className="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
      >
        <span className="text-xs md:text-sm">Begin</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
        </motion.div>
      </motion.button>
    </SlideWrapper>
  );
};

export default TitleSlide;
