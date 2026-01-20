import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const competitors = [
  { name: "Elyphant", position: "top-right", isUs: true },
  { name: "Gift Registries", subtitle: "Zola, Amazon", position: "bottom-left" },
  { name: "Subscription Boxes", subtitle: "Cratejoy, FabFitFun", position: "bottom-right" },
  { name: "Gift Cards", subtitle: "Venmo, PayPal", position: "top-left" },
];

const featureComparison = [
  { feature: "AI Gift Selection", elyphant: true, zola: false, amazon: false, chatgpt: "partial" },
  { feature: "Auto-Scheduling", elyphant: true, zola: false, amazon: false, chatgpt: false },
  { feature: "Wishlist Intelligence", elyphant: true, zola: "partial", amazon: "partial", chatgpt: false },
  { feature: "Seamless Fulfillment", elyphant: true, zola: false, amazon: true, chatgpt: false },
];

const CompetitionSlide = ({ direction }: SlideProps) => {
  const renderFeatureIcon = (value: boolean | string) => {
    if (value === true) return <Check className="w-4 h-4 text-green-400" />;
    if (value === false) return <X className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

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
        Competitive Landscape
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-10"
      >
        We Stand Alone
      </motion.h2>

      <div className="flex flex-col lg:flex-row items-start gap-8 max-w-6xl w-full">
        {/* 2x2 Quadrant */}
        <motion.div 
          variants={itemVariants}
          className="relative w-full lg:w-1/2 aspect-square max-w-md mx-auto"
        >
          {/* Axes */}
          <div className="absolute inset-0">
            {/* Vertical axis */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
            {/* Horizontal axis */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
            
            {/* Axis labels */}
            <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-xs text-gray-500 -rotate-90">Manual</span>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-xs text-gray-500 -rotate-90">Automated</span>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-xs text-gray-500">Proactive</span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-gray-500">Reactive</span>
          </div>

          {/* Quadrant items */}
          {/* Top-right: Elyphant (Automated + Proactive) */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute top-6 right-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/30 to-sky-500/30 border border-purple-500/50"
          >
            <div className="text-white font-bold">Elyphant ⭐</div>
            <div className="text-xs text-gray-400">AI + Automated</div>
          </motion.div>

          {/* Top-left: Gift Cards (Manual + Proactive) */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute top-6 left-6 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="text-gray-300 font-medium text-sm">Gift Cards</div>
            <div className="text-xs text-gray-500">Venmo, PayPal</div>
          </motion.div>

          {/* Bottom-left: Registries (Manual + Reactive) */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute bottom-6 left-6 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="text-gray-300 font-medium text-sm">Registries</div>
            <div className="text-xs text-gray-500">Zola, Amazon</div>
          </motion.div>

          {/* Bottom-right: Subscription Boxes (Automated + Reactive) */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-6 right-6 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="text-gray-300 font-medium text-sm">Subscriptions</div>
            <div className="text-xs text-gray-500">Cratejoy</div>
          </motion.div>
        </motion.div>

        {/* Feature comparison table */}
        <motion.div 
          variants={itemVariants}
          className="w-full lg:w-1/2"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 gap-2 p-3 bg-white/5 text-xs font-medium">
              <div className="text-gray-400">Feature</div>
              <div className="text-center text-purple-400">Elyphant</div>
              <div className="text-center text-gray-400">Zola</div>
              <div className="text-center text-gray-400">Amazon</div>
              <div className="text-center text-gray-400">ChatGPT</div>
            </div>
            {featureComparison.map((row, index) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="grid grid-cols-5 gap-2 p-3 border-t border-white/5 text-sm"
              >
                <div className="text-gray-300">{row.feature}</div>
                <div className="flex justify-center">{renderFeatureIcon(row.elyphant)}</div>
                <div className="flex justify-center">{renderFeatureIcon(row.zola)}</div>
                <div className="flex justify-center">{renderFeatureIcon(row.amazon)}</div>
                <div className="flex justify-center">{renderFeatureIcon(row.chatgpt)}</div>
              </motion.div>
            ))}
          </div>
          
          <p className="text-gray-500 text-xs mt-4 text-center">
            No existing platform combines AI intelligence with automated gift fulfillment
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CompetitionSlide;
