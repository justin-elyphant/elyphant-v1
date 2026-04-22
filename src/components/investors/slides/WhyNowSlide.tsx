import { motion } from 'framer-motion';
import { Brain, Users, Heart, ExternalLink } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const timingFactors = [
  {
    icon: Brain,
    title: "AI Maturity",
    stats: [
      { value: "AI", text: "shopping agents are moving from search to purchase decisions" },
      { value: "2030", text: "retailers preparing for AI-led commerce workflows" },
    ],
    source: "Deloitte agentic commerce",
    href: "https://www.deloitte.com/us/en/industries/consumer/articles/agentic-commerce-ai-shopping-agents-guide.html",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Users,
    title: "Consumer Readiness",
    stats: [
      { value: "33%", text: "of Gen Z prefer AI platforms for product research" },
      { value: "26%", text: "of Millennials show the same preference" },
    ],
    source: "Commerce/Future Commerce, 2025",
    href: "https://markets.financialcontent.com/wedbush/article/gnwcq-2025-9-15-1-in-3-gen-z-and-1-in-4-millennials-now-turn-to-ai-platforms-over-other-channels-for-shopping-advice-according-to-new-survey-from-commerce-and-future-commerce",
    color: "from-sky-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Personalization Demand",
    stats: [
      { value: "81%", text: "ignore irrelevant brand messages" },
      { value: "93%", text: "say personalization influences loyalty" },
    ],
    source: "Attentive, 2025/2026",
    href: "https://www.attentive.com/state-of-conversational-commerce",
    color: "from-pink-500 to-rose-500",
  },
];

const WhyNowSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3"
      >
        Market Timing
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-4 md:mb-6"
      >
        Why Now?
      </motion.h2>

      {/* Timing factors */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-4"
      >
        {timingFactors.map((factor, index) => (
          <motion.div
            key={factor.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${factor.color} flex items-center justify-center mb-3`}>
              <factor.icon className="w-5 h-5 text-white" />
            </div>
            
            <h3 className="text-base font-semibold text-white mb-3">
              {factor.title}
            </h3>
            
            <div className="space-y-2 mb-3">
              {factor.stats.map((stat, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent flex-shrink-0">
                    {stat.value}
                  </span>
                  <span className="text-muted-foreground text-xs leading-tight">
                    {stat.text}
                  </span>
                </div>
              ))}
            </div>
            
            <a href={factor.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground text-[10px] underline decoration-dotted underline-offset-2 hover:text-foreground">
              Source: {factor.source} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* Convergence callout */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-purple-500/10 via-sky-500/10 to-pink-500/10 border border-white/10 rounded-xl px-4 py-3 w-full text-center"
      >
        <p className="text-muted-foreground/50 text-xs md:text-sm">
          The convergence of <span className="text-purple-400 font-semibold">AI capability</span> + 
          <span className="text-sky-400 font-semibold"> consumer trust</span> + 
          <span className="text-pink-400 font-semibold"> personalization demand</span> creates a 
          <span className="text-white font-semibold"> once-in-a-generation opportunity</span>
        </p>
      </motion.div>
    </SlideWrapper>
  );
};

export default WhyNowSlide;
