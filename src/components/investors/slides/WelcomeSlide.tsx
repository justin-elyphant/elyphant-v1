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

      {/* Main logo container with zoom animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1, 1.8, 2.2],
          opacity: [0, 1, 1, 1]
        }}
        transition={{ 
          duration: 2.5,
          times: [0, 0.2, 0.7, 1],
          ease: [0.25, 0.1, 0.25, 1]
        }}
        className="flex items-center gap-4 md:gap-6 lg:gap-8 z-10"
      >
        {/* Gift icon with glow */}
        <motion.div
          animate={{ 
            filter: ['drop-shadow(0 0 20px rgba(56,189,248,0.3))', 'drop-shadow(0 0 40px rgba(56,189,248,0.6))', 'drop-shadow(0 0 60px rgba(56,189,248,0.8))']
          }}
          transition={{ duration: 2.5, times: [0, 0.5, 1] }}
        >
          <Gift className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 text-sky-400" />
        </motion.div>

        {/* Elyphant text with gradient */}
        <motion.span 
          className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 bg-clip-text text-transparent"
          animate={{
            filter: ['drop-shadow(0 0 10px rgba(168,85,247,0.3))', 'drop-shadow(0 0 30px rgba(168,85,247,0.5))', 'drop-shadow(0 0 50px rgba(168,85,247,0.7))']
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
        className="absolute bottom-40 md:bottom-44 text-xl md:text-2xl lg:text-3xl text-gray-300 text-center z-10"
      >
        The Future of Thoughtful Gifting
      </motion.p>

      {/* Continue button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        onClick={onNext}
        className="absolute bottom-24 flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors z-10"
      >
        <span className="text-sm">Discover Our Solution</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 2.5 }}
        >
          <ChevronDown className="w-6 h-6" />
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
            x: [0, (i % 2 === 0 ? 1 : -1) * (50 + i * 30)],
            y: [0, (i % 3 === 0 ? -1 : 1) * (40 + i * 20)]
          }}
          transition={{ 
            duration: 2,
            delay: 1 + i * 0.15,
            ease: "easeOut"
          }}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-sky-400"
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
