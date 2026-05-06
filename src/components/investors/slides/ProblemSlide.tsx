import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import AnimatedCounter from '../AnimatedCounter';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ProblemSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-4 md:mb-6"
      >
        The Problem
      </motion.span>

      {/* Hero message — the human problem */}
      <motion.div variants={itemVariants} className="text-center mb-6 md:mb-8 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
          Connecting through gifting —
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent">
            every person, every moment.
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Today, that connection breaks down. Birthdays get forgotten, gifts miss the mark, and moments meant to strengthen relationships quietly erode them instead.
        </p>
      </motion.div>

      {/* Supporting evidence — failure rate + market size */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-4"
      >
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 text-center">
          <div className="text-3xl md:text-4xl font-bold text-red-400 mb-1">
            <AnimatedCounter value={30} duration={1.5} />%
          </div>
          <p className="text-white text-sm font-medium">
            of gifts are returned, regifted, or unwanted
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            ~2x the 15.8% retail return rate
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center">
          <div className="text-3xl md:text-4xl font-bold text-white mb-1">
            $<AnimatedCounter value={242} duration={2} />B
          </div>
          <p className="text-white text-sm font-medium">
            US personal gifting market
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            A massive category with a structural failure rate
          </p>
        </div>
      </motion.div>

      {/* Bridge to solution */}
      <motion.p 
        variants={itemVariants}
        className="text-muted-foreground text-sm md:text-base italic mb-3 text-center max-w-xl"
      >
        No one has solved the data problem behind why gifts miss — until now.
      </motion.p>

      {/* Sources */}
      <motion.div
        variants={itemVariants}
        className="text-muted-foreground text-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
      >
        <span>Sources:</span>
        <a href="https://www.unitymarketingonline.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          Unity Marketing / Coresight <ExternalLink className="h-3 w-3" />
        </a>
        <a href="https://nrf.com/research/2025-retail-returns-landscape" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          NRF 2025 Returns <ExternalLink className="h-3 w-3" />
        </a>
        <a href="https://optoro.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
          Optoro Returns Report <ExternalLink className="h-3 w-3" />
        </a>
      </motion.div>
    </SlideWrapper>
  );
};

export default ProblemSlide;
