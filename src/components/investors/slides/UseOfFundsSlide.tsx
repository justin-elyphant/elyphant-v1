import { motion } from 'framer-motion';
import { Megaphone, Users, Code, Briefcase, Server, Scale } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import { Progress } from '@/components/ui/progress';
import AcronymTooltip from '../AcronymTooltip';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const useOfFunds = [
  {
    category: 'Marketing & Growth',
    amount: '$1.88M',
    percentage: 54,
    icon: Megaphone,
    purpose: 'Paid ads, influencer, brand campaigns + 2 FTE creative & growth team',
  },
  {
    category: 'Talent',
    amount: '$690K',
    percentage: 20,
    icon: Users,
    purpose: 'Sales Manager (vendor acquisition), Product, and Engineer support',
  },
  {
    category: 'Infrastructure & Tooling',
    amount: '$200K',
    percentage: 6,
    icon: Server,
    purpose: 'Supabase, Stripe, Zinc, AI Gateway, monitoring & dev tools',
  },
  {
    category: 'Legal, Patent & Operations',
    amount: '$130K',
    percentage: 4,
    icon: Scale,
    purpose: 'Patent prosecution, contracts, accounting, compliance',
  },
  {
    category: 'Reserve / Contingency',
    amount: '$600K',
    percentage: 16,
    icon: Briefcase,
    purpose: '~3 months buffer to extend optionality before Series A',
  },
];

const UseOfFundsSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction} verticalScroll>
      <motion.span
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-2"
      >
        Use of Funds
      </motion.span>

      <motion.h2
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-4 md:mb-6"
      >
        $3.5M Deployed Over 24 Months
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="text-muted-foreground text-xs md:text-sm text-center mb-4 max-w-2xl"
      >
        Engineered for capital efficiency: ~54% into growth (ads + marketing + sales),
        ~15% into core team, ~10% into infra & legal, ~16% reserve.
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl space-y-2 mb-4"
      >
        {useOfFunds.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <item.icon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="text-white text-xs md:text-sm font-medium truncate">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-muted-foreground text-[10px] md:text-xs">{item.amount}</span>
                <span className="text-white text-xs md:text-sm font-bold w-10 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <Progress value={item.percentage * 2.2} className="h-1 bg-white/10 mb-1" />
            <p className="text-muted-foreground text-[10px] italic">{item.purpose}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl grid grid-cols-3 gap-2 mb-3"
      >
        <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Y1 Burn</div>
          <div className="text-base md:text-lg font-bold text-white">~$1.6M</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Y2 Burn</div>
          <div className="text-base md:text-lg font-bold text-white">~$1.9M</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 rounded-lg p-2 text-center">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
            <AcronymTooltip
              acronym="Runway"
              definition="Months of operation funded at projected burn"
              calculation={`$3.5M raise + ~$200K residual founder cash ÷ ~$155K avg monthly burn ≈ 22–24 months.`}
            />
          </div>
          <div className="text-base md:text-lg font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
            22–24 mo
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
};

export default UseOfFundsSlide;
