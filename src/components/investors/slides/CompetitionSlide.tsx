import { motion } from 'framer-motion';
import { Check, X, Crown, Target, TrendingUp } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const competitors = [
  { 
    name: "Etsy", 
    tier: "Giant",
    funding: "$7B+",
    fundingLabel: "market cap",
    gap: "Marketplace, not gifting-focused",
    accent: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    icon: Crown
  },
  { 
    name: "Elfster", 
    tier: "Tier 1",
    funding: "$98M",
    fundingLabel: "raised",
    gap: "No automation, no AI",
    accent: "from-purple-500/10 to-purple-500/10",
    border: "border-purple-500/20",
    icon: Target
  },
  { 
    name: "Snappy", 
    tier: "Tier 1",
    funding: "$70M",
    fundingLabel: "raised",
    gap: "B2B only, no consumer",
    accent: "from-purple-500/10 to-purple-500/10",
    border: "border-purple-500/20",
    icon: Target
  },
  { 
    name: "Goody", 
    tier: "Tier 2",
    funding: "Funded",
    fundingLabel: "",
    gap: "B2B focus, no group funding",
    accent: "from-gray-500/10 to-gray-500/10",
    border: "border-gray-500/20",
    icon: TrendingUp
  },
];

const featureComparison = [
  { feature: "AI Gift Selection", elyphant: true, etsy: false, elfster: false, snappy: false, goody: true },
  { feature: "Auto-Gifting", elyphant: true, etsy: false, elfster: false, snappy: false, goody: false },
  { feature: "On-Platform Purchasing", elyphant: true, etsy: true, elfster: false, snappy: true, goody: true },
  { feature: "Group Funding", elyphant: true, etsy: false, elfster: false, snappy: false, goody: false },
  { feature: "Giftee Wishlist", elyphant: true, etsy: false, elfster: true, snappy: false, goody: true },
  { feature: "Gift Scheduling", elyphant: true, etsy: false, elfster: false, snappy: true, goody: false },
  { feature: "Consumer Focus", elyphant: true, etsy: true, elfster: true, snappy: false, goody: false },
  { feature: "Retailer API Integration", elyphant: true, etsy: false, elfster: true, snappy: true, goody: false },
];

const keyStats = [
  { stat: "0/12", label: "competitors offer Auto-Gifting" },
  { stat: "1/12", label: "has Group Funding" },
  { stat: "$7B+", label: "in market cap, 0 solve 'never forget'" },
];

const CompetitionSlide = ({ direction }: SlideProps) => {
  const renderFeatureIcon = (value: boolean) => {
    if (value) return <Check className="w-4 h-4 text-green-400" />;
    return <X className="w-4 h-4 text-gray-600" />;
  };

  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8 py-6 overflow-y-auto"
    >
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-sm mb-4"
      >
        Competitive Landscape
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-2"
      >
        $7B+ Market Cap. <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">0 Offer Automation.</span>
      </motion.h2>

      {/* Subtitle */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-center mb-6 text-sm md:text-base"
      >
        The giants are missing what matters most
      </motion.p>

      {/* Competitor Cards - Funding Validation */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-3 mb-6 max-w-5xl"
      >
        {competitors.map((comp, index) => {
          const Icon = comp.icon;
          return (
            <motion.div
              key={comp.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`bg-gradient-to-br ${comp.accent} border ${comp.border} rounded-xl px-4 py-3 min-w-[140px]`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${comp.tier === 'Giant' ? 'text-amber-400' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-500 uppercase tracking-wider">{comp.tier}</span>
              </div>
              <div className="text-white font-bold text-lg">{comp.name}</div>
              <div className="text-purple-300 font-semibold text-sm">
                {comp.funding} <span className="text-gray-500 font-normal">{comp.fundingLabel}</span>
              </div>
              <div className="text-gray-500 text-xs mt-1">{comp.gap}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Feature Comparison Table */}
      <motion.div 
        variants={itemVariants}
        className="w-full max-w-4xl"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium text-xs md:text-sm">Feature</TableHead>
                <TableHead className="text-center bg-gradient-to-b from-purple-500/20 to-sky-500/20">
                  <span className="text-white font-bold text-xs md:text-sm">Elyphant</span>
                </TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-xs md:text-sm">Etsy</TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-xs md:text-sm">Elfster</TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-xs md:text-sm">Snappy</TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-xs md:text-sm">Goody</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureComparison.map((row, index) => (
                <TableRow 
                  key={row.feature}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-gray-300 text-xs md:text-sm font-medium py-2">
                    {row.feature}
                    {(row.feature === "Auto-Gifting" || row.feature === "Group Funding") && (
                      <span className="ml-2 text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">UNIQUE</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center bg-gradient-to-b from-purple-500/10 to-sky-500/10 py-2">
                    {renderFeatureIcon(row.elyphant)}
                  </TableCell>
                  <TableCell className="text-center py-2">{renderFeatureIcon(row.etsy)}</TableCell>
                  <TableCell className="text-center py-2">{renderFeatureIcon(row.elfster)}</TableCell>
                  <TableCell className="text-center py-2">{renderFeatureIcon(row.snappy)}</TableCell>
                  <TableCell className="text-center py-2">{renderFeatureIcon(row.goody)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Key Differentiators */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-4 md:gap-8 mt-6"
      >
        {keyStats.map((item, index) => (
          <motion.div
            key={item.stat}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + index * 0.1 }}
            className="text-center"
          >
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
              {item.stat}
            </div>
            <div className="text-gray-500 text-xs md:text-sm max-w-[150px]">{item.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Closing Tagline */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-sm mt-6 text-center italic"
      >
        "We're building what $7B+ in market value hasn't solved"
      </motion.p>
    </motion.div>
  );
};

export default CompetitionSlide;
