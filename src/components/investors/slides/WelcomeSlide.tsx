import { motion } from 'framer-motion';
import { Gift, ChevronDown } from 'lucide-react';
import { slideVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WelcomeSlide = ({ direction, onNext }: SlideProps) => {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* Radial glow background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.4, 0.6], scale: [0.5, 1.2, 1.8] }}
        transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(147,51,234,0.3) 0%, rgba(56,189,248,0.15) 40%, transparent 70%)'
        }}
      />

      {/* Secondary glow ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.2, 0.3], scale: [0.8, 1.5, 2.2] }}
        transition={{ duration: 2.8, delay: 0.5, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(168,85,247,0.1) 50%, transparent 70%)'
        }}
      />

      {/* Main logo container with zoom animation - scaled for container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1, 1.5, 1.8],
          opacity: [0, 1, 1, 1]
        }}
        transition={{ 
          duration: 2.5,
          times: [0, 0.2, 0.7, 1],
          ease: [0.25, 0.1, 0.25, 1]
        }}
        className="flex items-center gap-2 sm:gap-3 md:gap-4 z-10"
      >
        {/* Gift icon with glow */}
        <motion.div
          animate={{ 
            filter: ['drop-shadow(0 0 15px rgba(56,189,248,0.3))', 'drop-shadow(0 0 30px rgba(56,189,248,0.6))', 'drop-shadow(0 0 45px rgba(56,189,248,0.8))']
          }}
          transition={{ duration: 2.5, times: [0, 0.5, 1] }}
        >
          <Gift className="w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 text-sky-400" />
        </motion.div>

        {/* Elyphant text with gradient */}
        <motion.span 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 bg-clip-text text-transparent"
          animate={{
            filter: ['drop-shadow(0 0 8px rgba(168,85,247,0.3))', 'drop-shadow(0 0 20px rgba(168,85,247,0.5))', 'drop-shadow(0 0 35px rgba(168,85,247,0.7))']
          }}
          transition={{ duration: 2.5, times: [0, 0.5, 1] }}
        >
          Elyphant
        </motion.span>
      </motion.div>

      {/* Tagline fade in */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-28 sm:bottom-32 md:bottom-36 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 text-center px-4 z-10"
      >
        The Future of Thoughtful Gifting
      </motion.p>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        onClick={onNext}
        className="absolute bottom-16 sm:bottom-18 md:bottom-20 flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition-colors z-10"
      >
        <span className="text-xs md:text-sm">Discover Our Solution</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 2.5 }}
        >
          <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
        </motion.div>
      </motion.button>

      {/* Particle sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0.5],
            x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 20)],
            y: [0, (i % 3 === 0 ? -1 : 1) * (25 + i * 15)]
          }}
          transition={{ 
            duration: 2,
            delay: 1 + i * 0.15,
            ease: "easeOut"
          }}
          className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-r from-purple-400 to-sky-400"
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      ))}
    </motion.div>
  );
};

export default WelcomeSlide;
