import { motion } from 'framer-motion';
import { slideVariants, itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const milestones = [
  { date: "Q1 2025", event: "Platform MVP Launch" },
  { date: "Q2 2025", event: "AI Gifting Engine (Nicole)" },
  { date: "Q3 2025", event: "Auto-Gift Automation" },
  { date: "Q4 2025", event: "1,000 Active Users" },
  { date: "Q1 2026", event: "Amazon Fulfillment Integration" },
];

const TractionSlide = ({ direction }: SlideProps) => {
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
        Traction
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-12"
      >
        Early Momentum
      </motion.h2>

      {/* Key metrics */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl w-full"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl md:text-5xl font-bold text-white mb-2">
            <AnimatedCounter value={2500} duration={2} />+
          </div>
          <div className="text-gray-400 text-sm">Users Registered</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl md:text-5xl font-bold text-white mb-2">
            <AnimatedCounter value={850} duration={1.8} />+
          </div>
          <div className="text-gray-400 text-sm">Gifts Delivered</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">
            <AnimatedCounter value={94} duration={1.5} />%
          </div>
          <div className="text-gray-400 text-sm">Satisfaction Rate</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">
            $<AnimatedCounter value={38} duration={1.5} />K
          </div>
          <div className="text-gray-400 text-sm">GMV To Date</div>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div 
        variants={itemVariants}
        className="relative max-w-4xl w-full"
      >
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-purple-500/50 to-sky-500/50" />
        <div className="flex justify-between">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="relative flex flex-col items-center"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-sky-500 mb-3" />
              <div className="text-white text-sm font-medium">{milestone.date}</div>
              <div className="text-gray-500 text-xs text-center max-w-[80px] mt-1">
                {milestone.event}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TractionSlide;
