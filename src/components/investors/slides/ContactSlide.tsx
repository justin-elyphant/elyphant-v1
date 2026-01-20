import { motion } from 'framer-motion';
import { Mail, Calendar, ArrowRight } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';
import { Button } from '@/components/ui/button';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ContactSlide = ({ direction }: SlideProps) => {
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
        Let's Connect
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4"
      >
        Join Us on This Journey
      </motion.h2>

      <motion.p 
        variants={itemVariants}
        className="text-gray-400 text-lg mb-12 text-center max-w-2xl"
      >
        We're raising our seed round to scale the platform and bring effortless gifting to millions.
      </motion.p>

      {/* The Ask */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-purple-500/20 to-sky-500/20 border border-purple-500/30 rounded-2xl px-12 py-8 mb-12 text-center"
      >
        <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">
          Raising
        </div>
        <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-2">
          $1.5M
        </div>
        <div className="text-gray-400">
          Seed Round
        </div>
      </motion.div>

      {/* Contact buttons */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white px-8"
          onClick={() => window.open('mailto:invest@elyphant.com', '_blank')}
        >
          <Mail className="w-5 h-5 mr-2" />
          invest@elyphant.com
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 px-8"
          onClick={() => window.open('https://calendly.com', '_blank')}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Schedule a Call
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.div 
        variants={itemVariants}
        className="absolute bottom-8 flex items-center gap-6 text-gray-500 text-sm"
      >
        <a 
          href="https://elyphant.com" 
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          elyphant.com <ArrowRight className="w-3 h-3" />
        </a>
        <span>•</span>
        <span>Made with 💜 in 2026</span>
      </motion.div>
    </motion.div>
  );
};

export default ContactSlide;
