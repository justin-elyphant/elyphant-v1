import { motion } from 'framer-motion';
import { slideVariants, itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const MarketSlide = ({ direction }: SlideProps) => {
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
        className="text-purple-400 uppercase tracking-widest text-sm mb-6"
      >
        Market Opportunity
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-12"
      >
        Massive & Growing Market
      </motion.h2>

      {/* TAM/SAM/SOM circles */}
      <motion.div 
        variants={itemVariants}
        className="relative flex items-center justify-center mb-8"
      >
        {/* TAM - outer ring */}
        <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
          <span className="absolute -top-8 text-purple-400 text-sm font-medium">TAM</span>
        </div>
        
        {/* SAM - middle ring */}
        <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-sky-500/50 flex items-center justify-center">
          <span className="absolute -top-6 text-sky-400 text-sm font-medium">SAM</span>
        </div>
        
        {/* SOM - center */}
        <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 border-2 border-white/30 flex items-center justify-center">
          <span className="absolute -top-6 text-white text-sm font-medium">SOM</span>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">
              $<AnimatedCounter value={500} duration={1.5} />M
            </div>
            <div className="text-gray-400 text-xs">Year 5</div>
          </div>
        </div>
      </motion.div>

      {/* Market size legend */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-3 gap-8 mt-8"
      >
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-purple-400">
            $<AnimatedCounter value={250} duration={2} />B
          </div>
          <div className="text-gray-500 text-sm mt-1">US Gift Market</div>
          <div className="text-gray-600 text-xs mt-0.5">Statista 2025</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-sky-400">
            $<AnimatedCounter value={52} duration={1.8} />B
          </div>
          <div className="text-gray-500 text-sm mt-1">Online Gifting</div>
          <div className="text-gray-600 text-xs mt-0.5">eMarketer 2025</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-white">
            $<AnimatedCounter value={12} duration={1.5} />B
          </div>
          <div className="text-gray-500 text-sm mt-1">AI-Powered Gifting</div>
          <div className="text-gray-600 text-xs mt-0.5">Grand View Research</div>
        </div>
      </motion.div>

      {/* AI market context */}
      <motion.div 
        variants={itemVariants}
        className="mt-8 bg-gradient-to-r from-purple-500/10 to-sky-500/10 border border-purple-500/20 rounded-xl px-6 py-3"
      >
        <span className="text-gray-400">AI Personalization Market: </span>
        <span className="text-white font-semibold">$105B → $168B by 2033</span>
        <span className="text-gray-600 text-sm ml-2">(Grand View Research)</span>
      </motion.div>
    </motion.div>
  );
};

export default MarketSlide;
