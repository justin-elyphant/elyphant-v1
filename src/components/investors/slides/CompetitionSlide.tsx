import { motion } from 'framer-motion';
import { Check, X, Crown, Target, TrendingUp, Info, Minus } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    funding: "~$6B",
    fundingLabel: "market cap",
    gap: "Marketplace + Gift Mode",
    accent: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    icon: Crown
  },
  { 
    name: "Elfster", 
    tier: "Tier 1",
    funding: "$98M",
    fundingLabel: "raised",
    gap: "Wishlist + exchanges",
    accent: "from-purple-500/10 to-purple-500/10",
    border: "border-purple-500/20",
    icon: Target
  },
  { 
    name: "Snappy", 
    tier: "Tier 1",
    funding: "$70M",
    fundingLabel: "raised",
    gap: "Corporate AI gifting",
    accent: "from-purple-500/10 to-purple-500/10",
    border: "border-purple-500/20",
    icon: Target
  },
  { 
    name: "Goody", 
    tier: "Tier 2",
    funding: "Funded",
    fundingLabel: "",
    gap: "Business + personal",
    accent: "from-gray-500/10 to-gray-500/10",
    border: "border-gray-500/20",
    icon: TrendingUp
  },
];

type FeatureStatus = 'yes' | 'partial' | 'no';
type CompetitorKey = 'etsy' | 'elfster' | 'snappy' | 'goody';

interface FeatureCell {
  status: FeatureStatus;
  note?: string;
}

interface FeatureRow {
  feature: string;
  unique?: boolean;
  elyphant: FeatureCell;
  etsy: FeatureCell;
  elfster: FeatureCell;
  snappy: FeatureCell;
  goody: FeatureCell;
}

const featureComparison = [
  {
    feature: "AI Gift Discovery",
    elyphant: { status: 'yes' },
    etsy: { status: 'partial', note: "Etsy Gift Mode helps discovery, but Elyphant connects discovery to recipient profiles, relationships, scheduling, and checkout." },
    elfster: { status: 'no' },
    snappy: { status: 'partial', note: "Snappy's AI is built around corporate senders; Elyphant applies AI to consumer relationships, wishlists, and recurring gifting moments." },
    goody: { status: 'partial', note: "Goody supports curated and assisted gifting; Elyphant adds recipient intelligence, social graph context, and automation." },
  },
  {
    feature: "Relationship-Based Auto-Gifting",
    unique: true,
    elyphant: { status: 'yes' },
    etsy: { status: 'no' },
    elfster: { status: 'no' },
    snappy: { status: 'partial', note: "Snappy automates corporate campaigns; Elyphant automates personal relationship moments using social, wishlist, and occasion signals." },
    goody: { status: 'partial', note: "Goody supports business birthdays and work anniversaries; Elyphant is designed for consumer relationship automation." },
  },
  {
    feature: "Giftee Wishlist / Social Profile",
    elyphant: { status: 'yes' },
    etsy: { status: 'partial', note: "Etsy favorites are shopping signals, not a gifting social profile with relationship context and automation." },
    elfster: { status: 'yes', note: "Elfster has wishlists and exchanges; Elyphant pairs wishlists with AI recommendations, checkout, gift scheduling, and automated reminders." },
    snappy: { status: 'no' },
    goody: { status: 'partial', note: "Goody offers recipient choice, but not a persistent wishlist network or social gifting profile." },
  },
  {
    feature: "On-Platform Purchasing",
    elyphant: { status: 'yes' },
    etsy: { status: 'yes', note: "Etsy has marketplace checkout; Elyphant competes by tying checkout to relationship automation, address resolution, and gift timing." },
    elfster: { status: 'no' },
    snappy: { status: 'yes', note: "Snappy supports corporate purchasing; Elyphant competes with consumer gifting, social context, wishlist signals, and recurring relationship moments." },
    goody: { status: 'yes', note: "Goody supports gift sending and recipient choice; Elyphant adds social graph, auto-gifting, wishlist intelligence, group funding, and marketplace personalization." },
  },
  {
    feature: "Recipient Address Collection",
    elyphant: { status: 'yes' },
    etsy: { status: 'no' },
    elfster: { status: 'no' },
    snappy: { status: 'yes', note: "Snappy collects addresses for corporate send flows; Elyphant connects address resolution to consumer relationships and privacy controls." },
    goody: { status: 'yes', note: "Goody collects recipient-entered shipping details; Elyphant adds a reusable social profile layer and automated gifting context." },
  },
  {
    feature: "Consumer + Social Graph",
    elyphant: { status: 'yes' },
    etsy: { status: 'no' },
    elfster: { status: 'partial', note: "Elfster supports group exchanges, but Elyphant builds a broader social commerce graph for ongoing gifting." },
    snappy: { status: 'no' },
    goody: { status: 'partial', note: "Goody supports personal gifting, but Elyphant centers the experience on a relationship graph and recurring social signals." },
  },
  {
    feature: "Group Funding",
    unique: true,
    elyphant: { status: 'yes' },
    etsy: { status: 'no' },
    elfster: { status: 'no' },
    snappy: { status: 'no' },
    goody: { status: 'no' },
  },
] satisfies FeatureRow[];

const CompetitionSlide = ({ direction }: SlideProps) => {
  const renderFeatureIcon = (cell: FeatureCell, competitor?: CompetitorKey) => {
    const icon = cell.status === 'yes'
      ? <Check className="w-3 h-3 text-green-400" />
      : cell.status === 'partial'
        ? <Minus className="w-3 h-3 text-amber-300" />
        : <X className="w-3 h-3 text-muted-foreground" />;

    if (!competitor || !cell.note || cell.status === 'no') return <span className="inline-flex justify-center">{icon}</span>;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${competitor} ${cell.status} detail`}
            className="inline-flex items-center justify-center gap-0.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {icon}
            <Info className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-[220px] text-xs leading-snug">
          {cell.note}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
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
        Gifting tools exist. <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">Relationship automation does not.</span>
      </motion.h2>

      {/* Subtitle */}
      <motion.p 
        variants={itemVariants}
        className="text-muted-foreground text-center mb-4 text-xs"
      >
        Elyphant connects social graph, automated moments, wishlist intelligence, address resolution, and group gifting.
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
                <Icon className={`w-3 h-3 ${comp.tier === 'Giant' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{comp.tier}</span>
              </div>
              <div className="text-white font-bold text-sm">{comp.name}</div>
              <div className="text-purple-300 font-semibold text-xs">
                {comp.funding}
              </div>
              <div className="text-muted-foreground text-[10px]">{comp.gap}</div>
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
                <TableHead className="text-muted-foreground font-medium text-[10px] md:text-xs py-2">Feature</TableHead>
                <TableHead className="text-center bg-gradient-to-b from-purple-500/20 to-sky-500/20 py-2">
                  <span className="text-white font-bold text-[10px] md:text-xs">Elyphant</span>
                </TableHead>
                <TableHead className="text-center text-muted-foreground font-medium text-[10px] md:text-xs py-2">Etsy</TableHead>
                <TableHead className="text-center text-muted-foreground font-medium text-[10px] md:text-xs py-2">Elfster</TableHead>
                <TableHead className="text-center text-muted-foreground font-medium text-[10px] md:text-xs py-2">Snappy</TableHead>
                <TableHead className="text-center text-muted-foreground font-medium text-[10px] md:text-xs py-2">Goody</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureComparison.map((row) => (
                <TableRow 
                  key={row.feature}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell className="text-muted-foreground/50 text-[10px] md:text-xs font-medium py-1.5">
                    {row.feature}
                    {row.unique && (
                      <span className="ml-1 text-[8px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">UNIQUE</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center bg-gradient-to-b from-purple-500/10 to-sky-500/10 py-1.5">
                    {renderFeatureIcon(row.elyphant)}
                  </TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.etsy, 'etsy')}</TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.elfster, 'elfster')}</TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.snappy, 'snappy')}</TableCell>
                  <TableCell className="text-center py-1.5">{renderFeatureIcon(row.goody, 'goody')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-center text-[9px] leading-snug text-muted-foreground/70">
          Based on publicly marketed product capabilities as of 2026. “Partial” indicates limited, business-only, campaign-based, or non-core support.
        </p>
      </motion.div>

      {/* Closing Tagline */}
      <motion.p 
        variants={itemVariants}
        className="text-muted-foreground text-xs mt-4 text-center italic"
      >
        "We're building the relationship layer legacy gifting tools still have not solved"
      </motion.p>
      </SlideWrapper>
    </TooltipProvider>
  );
};

export default CompetitionSlide;
