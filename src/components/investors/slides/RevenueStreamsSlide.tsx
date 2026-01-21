import { motion } from 'framer-motion';
import { ShoppingBag, Repeat, Store, MousePointerClick } from 'lucide-react';
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
    rate: "20% of GMV",
    year2: "$1.12M",
    year5: "$11.2M",
    status: "Active",
    note: "Core revenue engine",
    color: "purple",
  },
  {
    icon: Repeat,
    title: "Auto-Gift Subscriptions",
    rate: "$9.99/month",
    year2: "$60K",
    year5: "$600K",
    status: "Active",
    note: "2% subscriber conversion",
    color: "green",
  },
  {
    icon: MousePointerClick,
    title: "Sponsored Listings",
    rate: "$0.75 CPC",
    year2: "$45K",
    year5: "$450K",
    status: "Q2 2026",
    note: "5% product promotion rate",
    color: "purple",
  },
  {
    icon: Store,
    title: "Vendor Commissions",
    rate: "15% of vendor sales",
    year2: "—",
    year5: "$1.7M",
    status: "Roadmap",
    note: "Unlocked after 500K users",
    color: "gray",
  },
];

const revenueMix = [
  { label: "Gifting Fees", percent: 80, color: "from-purple-500 to-purple-400" },
  { label: "Vendor", percent: 12, color: "from-sky-500 to-sky-400" },
  { label: "Subs", percent: 4, color: "from-green-500 to-green-400" },
  { label: "Ads", percent: 4, color: "from-amber-500 to-amber-400" },
];

const RevenueStreamsSlide = ({ direction }: SlideProps) => {
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
        Revenue Streams
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-8"
      >
        Path to $14M+ Annual Revenue
      </motion.h2>

      {/* Revenue streams - 2x2 grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-6"
      >
        {revenueStreams.map((stream, index) => (
          <motion.div
            key={stream.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="relative bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            {/* Status badge */}
            <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${
              stream.status === 'Active' 
                ? 'bg-green-500/20 text-green-400' 
                : stream.status === 'Roadmap'
                ? 'bg-gray-500/20 text-gray-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {stream.status}
            </span>

            <div className="flex items-start gap-4">
              <stream.icon className="w-8 h-8 text-purple-400 flex-shrink-0" />
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {stream.title}
                </h3>
                
                <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-2">
                  {stream.rate}
                </div>

                {/* Year projections */}
                <div className="flex gap-4 text-sm mb-2">
                  <div>
                    <span className="text-gray-500">Year 2:</span>
                    <span className="text-white ml-1 font-medium">{stream.year2}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Year 5:</span>
                    <span className="text-green-400 ml-1 font-medium">{stream.year5}</span>
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm italic">
                  {stream.note}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue Mix Visualization */}
      <motion.div 
        variants={itemVariants}
        className="max-w-4xl w-full mb-6"
      >
        <p className="text-gray-400 text-sm mb-2 text-center">Year 5 Revenue Mix</p>
        <div className="h-8 rounded-full overflow-hidden flex bg-white/5">
          {revenueMix.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ width: 0 }}
              animate={{ width: `${item.percent}%` }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
              className={`h-full bg-gradient-to-r ${item.color} flex items-center justify-center`}
            >
              {item.percent >= 10 && (
                <span className="text-xs font-medium text-white">
                  {item.label} {item.percent}%
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {revenueMix.map((item) => (
            <div key={item.label} className="flex items-center gap-1 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`} />
              {item.label}: {item.percent}%
            </div>
          ))}
        </div>
      </motion.div>

      {/* Assumptions transparency box */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 max-w-4xl"
      >
        <p className="text-gray-500 text-xs text-center">
          <span className="text-gray-400 font-medium">Conservative projections:</span>{' '}
          25% active rate • $75 AOV • 3 gifts/user/year • 2% subscription conversion • $0.75 CPC
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RevenueStreamsSlide;
