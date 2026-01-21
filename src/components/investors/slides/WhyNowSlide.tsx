import { motion } from 'framer-motion';
import { Brain, Users, Heart } from 'lucide-react';
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
      { value: "68%", text: "of retailers deploying agentic AI in 12-24 months" },
      { value: "25%", text: "of e-commerce could be AI-handled by 2030" },
    ],
    source: "Deloitte, October 2025",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Users,
    title: "Consumer Readiness",
    stats: [
      { value: "47%", text: "of Gen Z/Millennials will let AI buy for them" },
      { value: "33%", text: "of Gen Z prefer AI over search for products" },
    ],
    source: "eMarketer, 2025",
    color: "from-sky-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Personalization Demand",
    stats: [
      { value: "74%", text: "expect more personalized shopping experiences" },
      { value: "~75%", text: "abandon carts due to choice overload" },
    ],
    source: "Klaviyo/Attentive, 2025",
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
                  <span className="text-gray-400 text-xs leading-tight">
                    {stat.text}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-gray-600 text-[10px]">
              Source: {factor.source}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Convergence callout */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-purple-500/10 via-sky-500/10 to-pink-500/10 border border-white/10 rounded-xl px-4 py-3 w-full text-center"
      >
        <p className="text-gray-300 text-xs md:text-sm">
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
