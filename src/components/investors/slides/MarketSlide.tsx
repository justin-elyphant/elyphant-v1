import { motion } from 'framer-motion';
import { slideVariants, itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

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
        className="text-purple-400 uppercase tracking-widest text-sm mb-4"
      >
        Market Opportunity
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-8"
      >
        Massive Market, Clear Path
      </motion.h2>

      {/* Two-column layout */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full mb-6"
      >
        {/* Left: Market Size */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-4">
            Market Size
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400">
                $<AnimatedCounter value={250} duration={2} />B
              </div>
              <div className="text-gray-400 text-sm">TAM: US Gift Market</div>
              <div className="text-gray-600 text-xs">Statista 2025</div>
            </div>
            
            <div>
              <div className="text-2xl md:text-3xl font-bold text-sky-400">
                $<AnimatedCounter value={12} duration={1.5} />B
              </div>
              <div className="text-gray-400 text-sm">SAM: AI-Powered Gifting</div>
              <div className="text-gray-600 text-xs">Grand View Research</div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold">15%+ CAGR</span>
              <span className="text-gray-500 text-sm">through 2030</span>
            </div>
          </div>
        </div>

        {/* Right: Our Path */}
        <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-2xl p-6">
          <h3 className="text-sky-400 text-sm font-semibold uppercase tracking-wider mb-4">
            Our 5-Year Path
          </h3>
          
          <div className="space-y-4">
            {/* Year 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Year 2</span>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">100K users</div>
                <div className="text-sky-400 text-sm">$1.3M revenue</div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gradient-to-b from-sky-500/50 to-white/50" />
            </div>
            
            {/* Year 5 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white font-medium">Year 5</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">1M users</div>
                <div className="text-xl font-bold text-green-400">$14M revenue</div>
              </div>
            </div>
            
            {/* GMV context */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Year 5 GMV:</span>
                <span className="text-white font-semibold">$56M</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unit Economics Transparency Box */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 max-w-3xl"
      >
        <div className="text-center">
          <span className="text-gray-500 text-sm">Conservative assumptions: </span>
          <span className="text-gray-400 text-sm">
            25% active rate • 3 gifts/user/year • $75 AOV • 20% take rate
          </span>
        </div>
      </motion.div>

      {/* AI market context */}
      <motion.div 
        variants={itemVariants}
        className="mt-4 bg-gradient-to-r from-purple-500/10 to-sky-500/10 border border-purple-500/20 rounded-xl px-6 py-3"
      >
        <span className="text-gray-400 text-sm">AI Personalization Market: </span>
        <span className="text-white font-semibold text-sm">$105B → $168B by 2033</span>
        <span className="text-gray-600 text-xs ml-2">(Grand View Research)</span>
      </motion.div>
    </motion.div>
  );
};

export default MarketSlide;
