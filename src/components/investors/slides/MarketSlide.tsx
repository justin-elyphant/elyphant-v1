import { motion } from 'framer-motion';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';
import AcronymTooltip from '../AcronymTooltip';
import { TrendingUp, Users, DollarSign, ExternalLink } from 'lucide-react';

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
              <div className="text-muted-foreground text-xs">
                <AcronymTooltip
                  acronym="TAM"
                  definition="Total Addressable Market"
                  calculation={`Total annual US personal-gifting spend.\nSource blend: Unity Marketing / Coresight (~$242B), rounded to $250B for the broader gifting category.`}
                />: US gifting behavior
              </div>
              <div className="text-muted-foreground text-[10px]">Model estimate from gifting market reports</div>
            </div>
            
            <div>
              <div className="text-xl md:text-2xl font-bold text-sky-400">
                $<AnimatedCounter value={12} duration={1.5} />B
              </div>
              <div className="text-muted-foreground text-xs">
                <AcronymTooltip
                  acronym="SAM"
                  definition="Serviceable Addressable Market"
                  calculation={`The slice of TAM we can realistically serve with an AI-powered gifting platform.\nEstimate: ~5% of $250B TAM ≈ $12B (US online + AI-influenced gifting).`}
                />: AI-powered gifting
              </div>
              <div className="text-muted-foreground text-[10px]">Internal estimate</div>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-sm font-semibold">
                15%+{' '}
                <AcronymTooltip
                  acronym="CAGR"
                  definition="Compound Annual Growth Rate"
                  calculation={`Average year-over-year growth, compounded.\nFormula: (End ÷ Start)^(1/years) − 1.\nGifting + AI-personalization forecasts converge at ~15%+ through 2030 (Grand View Research, Mintel).`}
                />
              </span>
              <span className="text-muted-foreground text-xs">through 2030</span>
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
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Year 2</span>
              </div>
              <div className="text-right">
                <div className="text-white text-sm font-semibold">100K users</div>
                <div className="text-sky-400 text-xs">
                  <AcronymTooltip
                    acronym="$1.8M revenue"
                    definition="Year 2 blended ARR across 4 streams"
                    calculation={`Marketplace fee: 100K × 25% × 3 × $75 × 30% ≈ $1.69M\n+ Subscriptions (Nicole+): ~$60K\n+ Advertising (sponsored placements): ~$45K\n+ Vendor fees (Y2): ~$0\n= ~$1.8M total ARR`}
                  />
                </div>
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
                <div className="text-lg font-bold text-green-400">
                  <AcronymTooltip
                    acronym="$19M revenue"
                    definition="Year 5 blended ARR across 4 streams"
                    calculation={`Marketplace fee: 1M × 25% × 3 × $75 × 30% ≈ $16.88M\n+ Subscriptions: ~$600K\n+ Advertising: ~$450K\n+ Vendor fees: ~$1.07M\n= ~$19M total ARR`}
                    className="decoration-green-400/60"
                  />
                </div>
              </div>
            </div>
            
            {/* GMV context */}
            <div className="pt-1 border-t border-white/10">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  Year 5{' '}
                  <AcronymTooltip
                    acronym="GMV"
                    definition="Gross Merchandise Value"
                    calculation={`Total $ value of gifts transacted on the platform (before our take rate).\nCalc: 1M users × 25% active × 3 gifts/yr × $75 AOV ≈ $56M GMV.`}
                  />:
                </span>
                <span className="text-white text-sm font-semibold">$56M</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Year 2 Revenue Breakdown */}
      <motion.div
        variants={itemVariants}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full mb-2"
      >
        <div className="text-[10px] md:text-xs text-muted-foreground text-center">
          <span className="text-white font-semibold">Year 2 revenue breakdown:</span>{' '}
          Marketplace fee <span className="text-sky-400 font-medium">~$1.69M</span> (100K × 25% × 3 × $75 × 30%)
          {' • '}Subscriptions <span className="text-sky-400 font-medium">~$60K</span>
          {' • '}Advertising <span className="text-sky-400 font-medium">~$45K</span>
          {' = '}<span className="text-green-400 font-semibold">~$1.8M ARR</span>
        </div>
      </motion.div>

      {/* Unit Economics Transparency Box */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full"
      >
        <div className="text-center">
          <span className="text-muted-foreground text-xs">Conservative assumptions: </span>
          <span className="text-muted-foreground text-xs">
            25% active rate • 3 gifts/user/year • $75{' '}
            <AcronymTooltip
              acronym="AOV"
              definition="Average Order Value"
              calculation={`Average $ spent per gift order.\nBenchmarked from Amazon/Etsy gifting data and our pilot orders (~$60–$90 range).`}
            />
            {' '}• 30% gifting fee
          </span>
        </div>
      </motion.div>

      {/* AI market context */}
      <motion.div 
        variants={itemVariants}
        className="mt-2 bg-gradient-to-r from-purple-500/10 to-sky-500/10 border border-purple-500/20 rounded-lg px-4 py-2"
      >
        <span className="text-muted-foreground text-xs">AI personalization tailwind: </span>
        <span className="text-white font-semibold text-xs">market forecast through 2033</span>
        <a href="https://www.grandviewresearch.com/industry-analysis/ai-based-personalization-engines-market-report" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-muted-foreground text-[10px] ml-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          Grand View Research <ExternalLink className="h-2.5 w-2.5" />
        </a>
        <span className="text-muted-foreground text-[10px] mx-1">•</span>
        <a href="https://www.statista.com/topics/11796/popular-gifts-and-gifting-behavior-in-the-us/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-muted-foreground text-[10px] underline decoration-dotted underline-offset-2 hover:text-foreground">
          Statista gifting <ExternalLink className="h-2.5 w-2.5" />
        </a>
        <span className="text-muted-foreground text-[10px] mx-1">•</span>
        <a href="https://store.mintel.com/us/report/us-gifting-market-report/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-muted-foreground text-[10px] underline decoration-dotted underline-offset-2 hover:text-foreground">
          Mintel gifting <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </motion.div>
    </SlideWrapper>
  );
};

export default MarketSlide;
