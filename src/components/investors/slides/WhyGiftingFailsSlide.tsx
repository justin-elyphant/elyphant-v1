import { motion } from 'framer-motion';
import { Repeat, Calendar, Frown, ExternalLink } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const painPoints = [
  {
    icon: Repeat,
    title: "Wrong Gifts Get Returned",
    stat: "15.8%",
    description: "retail return rate highlights the cost of poor fit",
    source: "NRF 2025",
    href: "https://nrf.com/research/2025-retail-returns-landscape",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "Important Dates Forgotten",
    stat: "#1",
    description: "birthday cards outsell individual holiday card categories",
    source: "Hallmark birthday research",
    href: "https://corporate.hallmark.com/Holiday/Birthdays",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Frown,
    title: "Gift Shopping Is Stressful",
    stat: "2025",
    description: "holiday shoppers report gift anxiety and decision fatigue",
    source: "SurveyMonkey / Mixbook",
    href: "https://www.surveymonkey.com/curiosity/holiday-shopping-trends-statistics/",
    color: "from-purple-500 to-pink-500",
  },
];

const WhyGiftingFailsSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3 md:mb-4"
      >
        Root Causes
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6 md:mb-8"
      >
        Why Gifting Fails
      </motion.h2>

      {/* Pain points grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full"
      >
        {painPoints.map((point, index) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${point.color} flex items-center justify-center mb-3`}>
              <point.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">
              {point.stat}
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white mb-1">
              {point.title}
            </h3>
            <p className="text-muted-foreground text-xs md:text-sm mb-2">
              {point.description}
            </p>
            <a href={point.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground text-xs underline decoration-dotted underline-offset-2 hover:text-foreground">
              Source: {point.source} <ExternalLink className="h-3 w-3" />
            </a>
          </motion.div>
        ))}
      </motion.div>
    </SlideWrapper>
  );
};

export default WhyGiftingFailsSlide;
