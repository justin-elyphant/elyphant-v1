import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Target, Shield, Rocket } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import AcronymTooltip from '../AcronymTooltip';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const seriesAMilestones = [
  { label: '100K+ Users', detail: 'Q4 2027 target' },
  { label: '$1.8M ARR', detail: 'Y2 run-rate' },
  { label: '500+ Vendors', detail: 'Marketplace live' },
  { label: '25% Active Rate', detail: 'Cohort-validated' },
];

const TheAskSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction} verticalScroll>
      <motion.span
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-2"
      >
        The Ask
      </motion.span>

      <motion.h2
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4"
      >
        Seed Round to Series A
      </motion.h2>

      {/* Headline Ask */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
      >
        <div className="bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">
            Raising
          </div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
            $3.5M
          </div>
          <div className="text-muted-foreground text-[10px] mt-0.5">Seed (priced equity)</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-sky-400 mx-auto mb-1" />
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">
            <AcronymTooltip
              acronym="Pre-Money"
              definition="Company valuation before new investor capital is added"
              calculation={`Comp range for pre-revenue / early-revenue AI-consumer seeds in 2025–2026: $10M–$18M pre.\nElyphant: working product, $600K founder capital, patent pending, live pilot users → $12–15M pre.`}
            />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            $12–15M
          </div>
          <div className="text-muted-foreground text-[10px] mt-0.5">~21–26% dilution</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">
            Runway
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            22–24 mo
          </div>
          <div className="text-muted-foreground text-[10px] mt-0.5">To Series A metrics</div>
        </div>
      </motion.div>

      {/* Why this valuation is defensible */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3 mb-4"
      >
        <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2 text-center">
          Why $12–15M Pre Is Defensible
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-white text-xs font-semibold">$600K founder capital</div>
              <div className="text-muted-foreground text-[10px]">De-risks the round; skin in the game</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-white text-xs font-semibold">Patent pending</div>
              <div className="text-muted-foreground text-[10px]">Auto-Gift IP defensibility</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-white text-xs font-semibold">Live product + pilot users</div>
              <div className="text-muted-foreground text-[10px]">Stripe + Zinc + Nicole AI in production</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Series A Milestones */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="w-4 h-4 text-purple-400" />
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Milestones to Trigger Series A
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {seriesAMilestones.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="bg-gradient-to-br from-purple-500/10 to-sky-500/10 border border-white/10 rounded-lg p-2 text-center"
            >
              <div className="text-white text-xs md:text-sm font-bold">{m.label}</div>
              <div className="text-muted-foreground text-[10px]">{m.detail}</div>
            </motion.div>
          ))}
        </div>
        <p className="text-muted-foreground text-[10px] text-center mt-3 italic">
          Targeting $8–12M Series A at $40–60M pre once Y2 ARR + active-rate cohorts are validated.
        </p>
      </motion.div>
    </SlideWrapper>
  );
};

export default TheAskSlide;
