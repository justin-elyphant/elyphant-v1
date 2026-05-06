import { motion } from 'framer-motion';
import { ShoppingBag, Repeat, Store, MousePointerClick } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import AcronymTooltip from '../AcronymTooltip';

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
    rate: (
      <>
        30% of{' '}
        <AcronymTooltip
          acronym="GMV"
          definition="Gross Merchandise Value"
          calculation={`Total $ value of gifts transacted on the platform (before our take rate).\nY5 calc: 1M users × 25% active × 3 gifts/yr × $75 AOV ≈ $56M GMV → 30% take ≈ $16.8M.`}
        />
      </>
    ),
    year2: "$1.68M",
    year5: "$16.8M",
    status: "Active",
    note: "Core revenue engine",
  },
  {
    icon: Repeat,
    title: "Auto-Gift Subs",
    rate: "$9.99/month",
    year2: "$60K",
    year5: "$600K",
    status: "Active",
    note: "2% subscriber conversion",
  },
  {
    icon: MousePointerClick,
    title: "Sponsored Listings",
    rate: (
      <>
        $0.75{' '}
        <AcronymTooltip
          acronym="CPC"
          definition="Cost Per Click"
          calculation={`Advertiser pays $0.75 per shopper click on a sponsored product.\nY5 calc: ~5% of products promoted × estimated clicks ≈ $450K.`}
        />
      </>
    ),
    year2: "$45K",
    year5: "$450K",
    status: "Q2 2026",
    note: "5% product promotion rate",
  },
  {
    icon: Store,
    title: "Vendor Commissions",
    rate: "15% of vendor sales",
    year2: "—",
    year5: "$1.7M",
    status: "Roadmap",
    note: "Unlocked after 500K users",
  },
];

const revenueMix = [
  { label: "Gifting Fees", percent: 86, color: "from-purple-500 to-purple-400" },
  { label: "Vendor", percent: 9, color: "from-sky-500 to-sky-400" },
  { label: "Subs", percent: 3, color: "from-green-500 to-green-400" },
  { label: "Ads", percent: 2, color: "from-amber-500 to-amber-400" },
];

const RevenueStreamsSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction} verticalScroll>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-2"
      >
        Revenue Streams
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4"
      >
        Path to $19M+ Annual Revenue
      </motion.h2>

      {/* Revenue streams - 2x2 grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-4"
      >
        {revenueStreams.map((stream, index) => (
          <motion.div
            key={stream.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="relative bg-white/5 border border-white/10 rounded-xl p-3 md:p-4"
          >
            {/* Status badge */}
            <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full ${
              stream.status === 'Active' 
                ? 'bg-green-500/20 text-green-400' 
                : stream.status === 'Roadmap'
                ? 'bg-gray-500/20 text-muted-foreground'
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {stream.status}
            </span>

            <div className="flex items-start gap-3">
              <stream.icon className="w-6 h-6 text-purple-400 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-0.5">
                  {stream.title}
                </h3>
                
                <div className="text-base md:text-lg font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-1">
                  {stream.rate}
                </div>

                {/* Year projections */}
                <div className="flex gap-3 text-xs mb-1">
                  <div>
                    <span className="text-muted-foreground">Y2:</span>
                    <span className="text-white ml-1">{stream.year2}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Y5:</span>
                    <span className="text-green-400 ml-1">{stream.year5}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-[10px] md:text-xs italic">
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
        className="w-full mb-3"
      >
        <p className="text-muted-foreground text-xs mb-1.5 text-center">Year 5 Revenue Mix</p>
        <div className="h-6 rounded-full overflow-hidden flex bg-white/5">
          {revenueMix.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ width: 0 }}
              animate={{ width: `${item.percent}%` }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
              className={`h-full bg-gradient-to-r ${item.color} flex items-center justify-center`}
            >
              {item.percent >= 10 && (
                <span className="text-[10px] font-medium text-white">
                  {item.percent}%
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center gap-3 mt-1.5">
          {revenueMix.map((item) => (
            <div key={item.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full"
      >
        <p className="text-muted-foreground text-[10px] text-center">
          <span className="text-muted-foreground font-medium">Conservative:</span>{' '}
          Model assumptions: 100K→1M users • 25% active • $75{' '}
          <AcronymTooltip
            acronym="AOV"
            definition="Average Order Value"
            calculation={`Average $ spent per gift order. Benchmark range $60–$90 from gifting marketplaces + pilot data.`}
          />
          {' '}• 3 gifts/yr • 2% subs • 30% gifting fee
        </p>
      </motion.div>
    </SlideWrapper>
  );
};

export default RevenueStreamsSlide;
