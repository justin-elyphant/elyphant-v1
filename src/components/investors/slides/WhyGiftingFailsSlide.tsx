import { motion } from 'framer-motion';
import { Repeat, Calendar, Frown } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

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
    description: "65% of gift recipients return at least one gift yearly",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Calendar,
    title: "Important Dates Forgotten",
    description: "40% of people miss birthdays and anniversaries",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Frown,
    title: "Gift Shopping Is Stressful",
    description: "73% find choosing the right gift anxiety-inducing",
    color: "from-purple-500 to-pink-500",
  },
];

const WhyGiftingFailsSlide = ({ direction }: SlideProps) => {
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
        Root Causes
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-12"
      >
        Why Gifting Fails
      </motion.h2>

      {/* Pain points grid */}
      <motion.div 
        variants={itemVariants}
        className="grid md:grid-cols-3 gap-6 max-w-5xl w-full"
      >
        {painPoints.map((point, index) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${point.color} flex items-center justify-center mb-4`}>
              <point.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {point.title}
            </h3>
            <p className="text-gray-400">
              {point.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default WhyGiftingFailsSlide;
