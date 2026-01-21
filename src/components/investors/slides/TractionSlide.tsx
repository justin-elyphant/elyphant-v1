import { motion } from 'framer-motion';
import { Check, Circle, Target } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const milestones = [
  { date: "Q1 2025", event: "Platform Launch", status: "complete" },
  { date: "Q3 2025", event: "Nicole AI Beta", status: "complete" },
  { date: "Q1 2026", event: "Auto-Gift v2", status: "current" },
  { date: "Q2 2026", event: "5K Active", status: "upcoming" },
  { date: "Q4 2026", event: "$500K GMV", status: "target" },
];

const TractionSlide = ({ direction }: SlideProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="w-2.5 h-2.5 text-white" />;
      case 'current':
        return <Circle className="w-2 h-2 fill-current text-sky-400" />;
      case 'upcoming':
        return <Circle className="w-2 h-2 text-gray-500" />;
      case 'target':
        return <Target className="w-2.5 h-2.5 text-purple-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'current':
        return 'bg-sky-500 animate-pulse';
      case 'upcoming':
        return 'bg-gray-600';
      case 'target':
        return 'bg-gradient-to-r from-purple-500 to-sky-500';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3"
      >
        Traction
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4 md:mb-6"
      >
        Building Momentum
      </motion.h2>

      {/* Key metrics */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 w-full"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            <AnimatedCounter value={2500} duration={2} />+
          </div>
          <div className="text-gray-400 text-[10px] md:text-xs">Users Registered</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            <AnimatedCounter value={850} duration={1.8} />+
          </div>
          <div className="text-gray-400 text-[10px] md:text-xs">Gifts Delivered</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">
            <AnimatedCounter value={94} duration={1.5} />%
          </div>
          <div className="text-gray-400 text-[10px] md:text-xs">Satisfaction Rate</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-400 mb-1">
            $<AnimatedCounter value={38} duration={1.5} />K
          </div>
          <div className="text-gray-400 text-[10px] md:text-xs">GMV To Date</div>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div 
        variants={itemVariants}
        className="relative w-full overflow-x-auto"
      >
        <div className="min-w-[400px]">
          <div className="absolute left-[10%] right-[10%] top-3 h-0.5 bg-gradient-to-r from-green-500/50 via-sky-500/50 to-purple-500/50" />
          <div className="flex justify-between px-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="relative flex flex-col items-center"
              >
                <div className={`w-5 h-5 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center mb-2 border-2 border-gray-900`}>
                  {getStatusIcon(milestone.status)}
                </div>
                <div className={`text-[10px] md:text-xs font-medium ${milestone.status === 'current' ? 'text-sky-400' : 'text-white'}`}>
                  {milestone.date}
                </div>
                <div className={`text-[9px] md:text-[10px] text-center max-w-[60px] mt-0.5 ${milestone.status === 'current' ? 'text-sky-400/70' : 'text-gray-500'}`}>
                  {milestone.event}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
};

export default TractionSlide;
