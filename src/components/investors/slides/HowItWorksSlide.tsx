import { motion } from 'framer-motion';
import { Users, ListChecks, Sparkles, Gift } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

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
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3 md:mb-4"
      >
        The Experience
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6 md:mb-8"
      >
        How It Works
      </motion.h2>

      {/* Steps - responsive grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full"
      >
        {steps.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            {/* Step card */}
            <div className="relative mb-2">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 flex items-center justify-center">
                <step.icon className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-purple-500 to-sky-500 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full">
                {step.step}
              </span>
            </div>
            <h3 className="text-sm md:text-base font-semibold text-white mb-0.5">
              {step.title}
            </h3>
            <p className="text-gray-500 text-xs md:text-sm max-w-[120px]">
              {step.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </SlideWrapper>
  );
};

export default HowItWorksSlide;
