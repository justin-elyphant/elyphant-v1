import { motion } from 'framer-motion';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
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
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3"
      >
        Market Opportunity
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4 md:mb-6"
      >
        Massive Market, Clear Path
      </motion.h2>

      {/* Two-column layout */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full mb-4"
      >
        {/* Left: Market Size */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <h3 className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Market Size
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-purple-400">
                $<AnimatedCounter value={250} duration={2} />B
              </div>
              <div className="text-gray-400 text-xs">TAM: US Gift Market</div>
              <div className="text-gray-600 text-[10px]">Statista 2025</div>
            </div>
            
            <div>
              <div className="text-xl md:text-2xl font-bold text-sky-400">
                $<AnimatedCounter value={12} duration={1.5} />B
              </div>
              <div className="text-gray-400 text-xs">SAM: AI-Powered Gifting</div>
              <div className="text-gray-600 text-[10px]">Grand View Research</div>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-sm font-semibold">15%+ CAGR</span>
              <span className="text-gray-500 text-xs">through 2030</span>
            </div>
          </div>
        </div>

        {/* Right: Our Path */}
        <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 rounded-xl p-4">
          <h3 className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Our 5-Year Path
          </h3>
          
          <div className="space-y-3">
            {/* Year 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-sm">Year 2</span>
              </div>
              <div className="text-right">
                <div className="text-white text-sm font-semibold">100K users</div>
                <div className="text-sky-400 text-xs">$1.3M revenue</div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-0.5 h-4 bg-gradient-to-b from-sky-500/50 to-white/50" />
            </div>
            
            {/* Year 5 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-white" />
                <span className="text-white text-sm font-medium">Year 5</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">1M users</div>
                <div className="text-lg font-bold text-green-400">$14M revenue</div>
              </div>
            </div>
            
            {/* GMV context */}
            <div className="pt-1 border-t border-white/10">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-xs">Year 5 GMV:</span>
                <span className="text-white text-sm font-semibold">$56M</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unit Economics Transparency Box */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full"
      >
        <div className="text-center">
          <span className="text-gray-500 text-xs">Conservative assumptions: </span>
          <span className="text-gray-400 text-xs">
            25% active rate • 3 gifts/user/year • $75 AOV • 20% take rate
          </span>
        </div>
      </motion.div>

      {/* AI market context */}
      <motion.div 
        variants={itemVariants}
        className="mt-2 bg-gradient-to-r from-purple-500/10 to-sky-500/10 border border-purple-500/20 rounded-lg px-4 py-2"
      >
        <span className="text-gray-400 text-xs">AI Personalization Market: </span>
        <span className="text-white font-semibold text-xs">$105B → $168B by 2033</span>
        <span className="text-gray-600 text-[10px] ml-1">(Grand View Research)</span>
      </motion.div>
    </SlideWrapper>
  );
};

export default MarketSlide;
