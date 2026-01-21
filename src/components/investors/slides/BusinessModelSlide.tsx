import { motion } from 'framer-motion';
import { ShoppingBag, Repeat, Store, CreditCard } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

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
    description: "Commission on vendor partner sales",
    status: "Roadmap",
    vendorTypes: ["Retailers", "Venues", "Golf Courses", "Hotels"],
  },
  {
    icon: CreditCard,
    title: "Sponsored Listings",
    value: "$0.75 CPC",
    description: "Cost-per-click product promotion",
    status: "Q2 2026",
  },
];

const BusinessModelSlide = ({ direction }: SlideProps) => {
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
        Business Model
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-10"
      >
        Multiple Revenue Streams
      </motion.h2>

      {/* Revenue streams - 4 column grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl w-full mb-8"
      >
        {revenueStreams.map((stream, index) => (
          <motion.div
            key={stream.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="relative bg-white/5 border border-white/10 rounded-2xl p-5 overflow-hidden"
          >
            {/* Status badge with three-tier styling */}
            <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${
              stream.status === 'Active' 
                ? 'bg-green-500/20 text-green-400' 
                : stream.status === 'Roadmap'
                ? 'bg-gray-500/20 text-gray-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {stream.status}
            </span>

            <stream.icon className="w-8 h-8 text-purple-400 mb-3" />
            
            <h3 className="text-base font-semibold text-white mb-1">
              {stream.title}
            </h3>
            
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-2">
              {stream.value}
            </div>
            
            <p className="text-gray-500 text-sm">
              {stream.description}
            </p>

            {/* Vendor types for Vendor Marketplace card */}
            {'vendorTypes' in stream && stream.vendorTypes && (
              <div className="flex flex-wrap gap-1 mt-3">
                {stream.vendorTypes.map((type) => (
                  <span key={type} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                    {type}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Unit economics highlight */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-purple-500/10 to-sky-500/10 border border-purple-500/20 rounded-2xl px-8 py-5 flex items-center gap-8"
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-white">$75</div>
          <div className="text-gray-500 text-sm">Avg Order Value</div>
        </div>
        <div className="w-px h-12 bg-gray-700" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white">$15</div>
          <div className="text-gray-500 text-sm">Gross Margin/Order</div>
        </div>
        <div className="w-px h-12 bg-gray-700" />
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">20%</div>
          <div className="text-gray-500 text-sm">Take Rate</div>
        </div>
      </motion.div>

      {/* Win-Win Value Proposition with Vendor ROI */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl px-8 py-5 text-center mt-6"
      >
        <p className="text-white font-semibold text-lg mb-3">
          Two-Sided Value Creation
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div>
            <span className="text-purple-400 font-medium">Consumers:</span>
            <span className="text-gray-300 ml-2">Gift anxiety eliminated</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-gray-700" />
          <div>
            <span className="text-green-400 font-medium">Retailers:</span>
            <span className="text-gray-300 ml-2">Recover margin from 17% holiday returns</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-3 italic">
          Every prevented wrong gift = ~$32 saved in processing costs per $100 item
        </p>
      </motion.div>
    </motion.div>
  );
};

export default BusinessModelSlide;
