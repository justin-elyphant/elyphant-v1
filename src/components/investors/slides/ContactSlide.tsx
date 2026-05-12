import { motion } from 'framer-motion';
import { Mail, Calendar, ArrowRight, DollarSign, Shield } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
import { Button } from '@/components/ui/button';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ContactSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction} verticalScroll>
      {/* Section label */}
      <motion.span
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-2"
      >
        Let's Connect
      </motion.span>

      {/* Title */}
      <motion.h2
        variants={itemVariants}
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-3"
      >
        Join Us on This Journey
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="text-muted-foreground text-sm md:text-base text-center max-w-xl mb-6"
      >
        We're rebuilding gifting from the ground up — with AI, automation, and a real marketplace.
        If that excites you, let's talk.
      </motion.p>

      {/* Founder Commitment Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-center gap-3 mb-8"
      >
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white">$600K</div>
            <div className="text-[10px] text-muted-foreground">Founder Investment</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white">Patent</div>
            <div className="text-[10px] text-muted-foreground">Approved on Auto-Gift</div>
          </div>
        </div>
      </motion.div>

      {/* Contact buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-center gap-3 mb-6"
      >
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white px-6"
          onClick={() => window.open('mailto:invest@elyphant.com', '_blank')}
        >
          <Mail className="w-4 h-4 mr-2" />
          invest@elyphant.com
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white px-6"
          onClick={() => window.open('https://calendly.com/justin-elyphant/30min', '_blank')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule a Call
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-4 text-muted-foreground text-xs"
      >
        <a
          href="https://elyphant.com"
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          elyphant.com <ArrowRight className="w-2.5 h-2.5" />
        </a>
      </motion.div>
    </SlideWrapper>
  );
};

export default ContactSlide;
