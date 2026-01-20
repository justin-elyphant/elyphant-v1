import { motion } from 'framer-motion';
import { Users, ListChecks, Sparkles, Gift } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const steps = [
  {
    icon: Users,
    step: "01",
    title: "Connect Your People",
    description: "Add friends and family to your network",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "They Share Wishlists",
    description: "Recipients curate what they actually want",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Nicole Recommends",
    description: "AI suggests perfect gifts within budget",
  },
  {
    icon: Gift,
    step: "04",
    title: "Gifts Arrive On Time",
    description: "Automated delivery for every occasion",
  },
];

const HowItWorksSlide = ({ direction }: SlideProps) => {
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
        The Experience
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-16"
      >
        How It Works
      </motion.h2>

      {/* Steps flow */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-0 max-w-6xl w-full"
      >
        {steps.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="flex items-center"
          >
            {/* Step card */}
            <div className="flex flex-col items-center text-center px-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 flex items-center justify-center mb-3">
                  <step.icon className="w-8 h-8 text-purple-400" />
                </div>
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-sky-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm max-w-[150px]">
                {step.description}
              </p>
            </div>

            {/* Arrow connector (not on last) */}
            {index < steps.length - 1 && (
              <div className="hidden md:block text-purple-500/50 mx-2">
                <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                  <path 
                    d="M0 10H35M35 10L28 3M35 10L28 17" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default HowItWorksSlide;
