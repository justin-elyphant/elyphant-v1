import { motion } from 'framer-motion';
import { Repeat, Calendar, Frown } from 'lucide-react';
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
    stat: "65%",
    description: "of gift recipients return at least one gift yearly",
    source: "NRF 2025",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "Important Dates Forgotten",
    stat: "40%",
    description: "of people miss birthdays and anniversaries",
    source: "Hallmark Research",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Frown,
    title: "Gift Shopping Is Stressful",
    stat: "73%",
    description: "find choosing the right gift anxiety-inducing",
    source: "Consumer Survey 2025",
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
            <p className="text-gray-400 text-xs md:text-sm mb-2">
              {point.description}
            </p>
            <p className="text-gray-600 text-xs">
              Source: {point.source}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </SlideWrapper>
  );
};

export default WhyGiftingFailsSlide;
