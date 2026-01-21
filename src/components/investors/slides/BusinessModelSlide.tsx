import { motion } from 'framer-motion';
import { ShoppingBag, Repeat, Store, CreditCard } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const revenueStreams = [
  {
    icon: ShoppingBag,
    title: "Gifting Fees",
    value: "20%",
    description: "Fee on every gift purchase",
    status: "Active",
  },
  {
    icon: Repeat,
    title: "Auto-Gift Subscription",
    value: "$9.99/mo",
    description: "Premium automation features",
    status: "Active",
  },
  {
    icon: Store,
    title: "Vendor Marketplace",
    value: "15%",
    description: "Commission on vendor sales",
    status: "Roadmap",
  },
  {
    icon: CreditCard,
    title: "Sponsored Listings",
    value: "$0.75 CPC",
    description: "Cost-per-click promotion",
    status: "Q2 2026",
  },
];

const BusinessModelSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3"
      >
        Business Model
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4 md:mb-6"
      >
        Multiple Revenue Streams
      </motion.h2>

      {/* Revenue streams - 2x2 grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-4"
      >
        {revenueStreams.map((stream, index) => (
          <motion.div
            key={stream.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="relative bg-white/5 border border-white/10 rounded-xl p-3 md:p-4"
          >
            {/* Status badge */}
            <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full ${
              stream.status === 'Active' 
                ? 'bg-green-500/20 text-green-400' 
                : stream.status === 'Roadmap'
                ? 'bg-gray-500/20 text-gray-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {stream.status}
            </span>

            <stream.icon className="w-6 h-6 text-purple-400 mb-2" />
            
            <h3 className="text-xs md:text-sm font-semibold text-white mb-1">
              {stream.title}
            </h3>
            
            <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-1">
              {stream.value}
            </div>
            
            <p className="text-gray-500 text-[10px] md:text-xs">
              {stream.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Unit economics highlight */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-purple-500/10 to-sky-500/10 border border-purple-500/20 rounded-xl px-4 py-3 flex items-center justify-center gap-4 md:gap-6 flex-wrap"
      >
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-white">$75</div>
          <div className="text-gray-500 text-[10px] md:text-xs">Avg Order Value</div>
        </div>
        <div className="w-px h-8 bg-gray-700 hidden sm:block" />
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-white">$15</div>
          <div className="text-gray-500 text-[10px] md:text-xs">Gross Margin/Order</div>
        </div>
        <div className="w-px h-8 bg-gray-700 hidden sm:block" />
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-green-400">20%</div>
          <div className="text-gray-500 text-[10px] md:text-xs">Take Rate</div>
        </div>
      </motion.div>

      {/* Win-Win Value Proposition */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center mt-3 w-full"
      >
        <p className="text-white font-semibold text-sm mb-2">
          Two-Sided Value Creation
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs">
          <div>
            <span className="text-purple-400 font-medium">Consumers:</span>
            <span className="text-gray-300 ml-1">Gift anxiety eliminated</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-700" />
          <div>
            <span className="text-green-400 font-medium">Retailers:</span>
            <span className="text-gray-300 ml-1">17% holiday returns recovered</span>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
};

export default BusinessModelSlide;
