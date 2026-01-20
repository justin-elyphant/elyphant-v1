import { motion } from 'framer-motion';
import { Heart, Brain, Truck } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

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
        Our Solution
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4"
      >
        Elyphant Makes Gifting
        <br />
        <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
          Effortless
        </span>
      </motion.h2>

      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-lg mb-12 text-center max-w-2xl"
      >
        The world's first AI-powered platform that remembers, recommends, and delivers the perfect gift—automatically.
      </motion.p>

      {/* Three pillars */}
      <motion.div 
        variants={itemVariants}
        className="grid md:grid-cols-3 gap-8 max-w-5xl w-full"
      >
        {pillars.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.15, type: "spring" }}
            className="text-center"
          >
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20`}>
              <pillar.icon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {pillar.title}
            </h3>
            <p className="text-gray-400 text-sm">
              {pillar.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SolutionSlide;
