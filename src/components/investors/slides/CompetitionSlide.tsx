import { motion } from 'framer-motion';
import { Check, X, Crown, Target, TrendingUp } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
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
    gap: "Not gifting-focused",
    accent: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    icon: Crown
  },
  { 
    name: "Elfster", 
    tier: "Tier 1",
    funding: "$98M",
    fundingLabel: "raised",
    gap: "No AI",
    accent: "from-purple-500/10 to-purple-500/10",
    border: "border-purple-500/20",
    icon: Target
  },
  { 
    name: "Snappy", 
    tier: "Tier 1",
    funding: "$70M",
    fundingLabel: "raised",
    gap: "B2B only",
    accent: "from-purple-500/10 to-purple-500/10",
    border: "border-purple-500/20",
    icon: Target
  },
  { 
    name: "Goody", 
    tier: "Tier 2",
    funding: "Funded",
    fundingLabel: "",
    gap: "B2B focus",
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
];

const CompetitionSlide = ({ direction }: SlideProps) => {
  const renderFeatureIcon = (value: boolean) => {
    if (value) return <Check className="w-3 h-3 text-green-400" />;
    return <X className="w-3 h-3 text-gray-600" />;
  };

  return (
    <SlideWrapper direction={direction} verticalScroll>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-2"
      >
        Competitive Landscape
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-1"
      >
        $7B+ Market Cap. <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">0 Offer Automation.</span>
      </motion.h2>

      {/* Subtitle */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-center mb-4 text-xs"
      >
        The giants are missing what matters most
      </motion.p>

      {/* Competitor Cards */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-2 mb-4 w-full"
      >
        {competitors.map((comp, index) => {
          const Icon = comp.icon;
          return (
            <motion.div
              key={comp.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`bg-gradient-to-br ${comp.accent} border ${comp.border} rounded-lg px-3 py-2 min-w-[100px]`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <Icon className={`w-3 h-3 ${comp.tier === 'Giant' ? 'text-amber-400' : 'text-gray-400'}`} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{comp.tier}</span>
              </div>
              <div className="text-white font-bold text-sm">{comp.name}</div>
              <div className="text-purple-300 font-semibold text-xs">
                {comp.funding}
              </div>
              <div className="text-gray-500 text-[10px]">{comp.gap}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Feature Comparison Table */}
      <motion.div 
        variants={itemVariants}
        className="w-full overflow-x-auto"
      >
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden min-w-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium text-[10px] md:text-xs py-2">Feature</TableHead>
                <TableHead className="text-center bg-gradient-to-b from-purple-500/20 to-sky-500/20 py-2">
                  <span className="text-white font-bold text-[10px] md:text-xs">Elyphant</span>
                </TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-[10px] md:text-xs py-2">Etsy</TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-[10px] md:text-xs py-2">Elfster</TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-[10px] md:text-xs py-2">Snappy</TableHead>
                <TableHead className="text-center text-gray-400 font-medium text-[10px] md:text-xs py-2">Goody</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureComparison.map((row) => (
                <TableRow 
                  key={row.feature}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-gray-300 text-[10px] md:text-xs font-medium py-1.5">
                    {row.feature}
                    {(row.feature === "Auto-Gifting" || row.feature === "Group Funding") && (
                      <span className="ml-1 text-[8px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">UNIQUE</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center bg-gradient-to-b from-purple-500/10 to-sky-500/10 py-1.5">
                    {renderFeatureIcon(row.elyphant)}
                  </TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.etsy)}</TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.elfster)}</TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.snappy)}</TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.goody)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Closing Tagline */}
      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-xs mt-4 text-center italic"
      >
        "We're building what $7B+ in market value hasn't solved"
      </motion.p>
    </SlideWrapper>
  );
};

export default CompetitionSlide;
