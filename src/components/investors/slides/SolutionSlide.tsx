import { motion } from 'framer-motion';
import { Heart, Brain, Truck } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const pillars = [
  {
    icon: Heart,
    title: "Smart Wishlists",
    description: "Recipients curate exactly what they want. No more guessing.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Brain,
    title: "Auto-Gifting AI",
    description: "Nicole, our AI, handles scheduling, selection, and reminders.",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: Truck,
    title: "Seamless Delivery",
    description: "Automated fulfillment via Amazon. On time, every time.",
    gradient: "from-sky-500 to-cyan-500",
  },
];

const SolutionSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3 md:mb-4"
      >
        Our Solution
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-2"
      >
        Elyphant Makes Gifting
        <br />
        <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
          Effortless
        </span>
      </motion.h2>

      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-sm md:text-base mb-6 md:mb-8 text-center max-w-xl"
      >
        The world's first AI-powered platform that remembers, recommends, and delivers the perfect gift—automatically.
      </motion.p>

      {/* Three pillars */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full"
      >
        {pillars.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.15, type: "spring" }}
            className="text-center"
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 mx-auto rounded-xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20`}>
              <pillar.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-1">
              {pillar.title}
            </h3>
            <p className="text-gray-400 text-xs md:text-sm">
              {pillar.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </SlideWrapper>
  );
};

export default SolutionSlide;
