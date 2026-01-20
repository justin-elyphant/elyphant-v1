import { motion } from 'framer-motion';
import { Brain, Users, Heart } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

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
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
    >
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-sm mb-6"
      >
        Market Timing
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-12"
      >
        Why Now?
      </motion.h2>

      {/* Timing factors */}
      <motion.div 
        variants={itemVariants}
        className="grid md:grid-cols-3 gap-6 max-w-6xl w-full mb-10"
      >
        {timingFactors.map((factor, index) => (
          <motion.div
            key={factor.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${factor.color} flex items-center justify-center mb-4`}>
              <factor.icon className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-4">
              {factor.title}
            </h3>
            
            <div className="space-y-3 mb-4">
              {factor.stats.map((stat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {stat.text}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-gray-600 text-xs">
              Source: {factor.source}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Convergence callout */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-purple-500/10 via-sky-500/10 to-pink-500/10 border border-white/10 rounded-2xl px-8 py-5 max-w-4xl text-center"
      >
        <p className="text-gray-300 text-lg">
          The convergence of <span className="text-purple-400 font-semibold">AI capability</span> + 
          <span className="text-sky-400 font-semibold"> consumer trust</span> + 
          <span className="text-pink-400 font-semibold"> personalization demand</span> creates a 
          <span className="text-white font-semibold"> once-in-a-generation opportunity</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default WhyNowSlide;
