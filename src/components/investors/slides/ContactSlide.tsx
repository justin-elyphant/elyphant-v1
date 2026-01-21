import { motion } from 'framer-motion';
import { Mail, Calendar, ArrowRight, DollarSign, Shield, Megaphone, Code, Users, Target } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const useOfFunds = [
  { category: 'Growth & Marketing', amount: '$675K', percentage: 45, icon: Megaphone, purpose: 'User acquisition, vendor onboarding' },
  { category: 'Product & Engineering', amount: '$450K', percentage: 30, icon: Code, purpose: 'Nicole AI, Auto-Gift engine, Marketplace' },
  { category: 'Operations & Hiring', amount: '$375K', percentage: 25, icon: Users, purpose: 'Core team expansion' },
];

const milestones = [
  { label: '100K Users', timeline: 'Q4 2026' },
  { label: '$1.3M Revenue', timeline: 'Year 2' },
  { label: 'Marketplace', timeline: 'Q2 2026' },
  { label: 'Series A Ready', timeline: 'Q4 2026' },
];

const ContactSlide = ({ direction }: SlideProps) => {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8 overflow-y-auto py-8"
    >
      {/* Centered container for balanced layout */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Section label */}
        <motion.span 
          variants={itemVariants}
          className="text-purple-400 uppercase tracking-widest text-sm mb-4"
        >
          Let's Connect
        </motion.span>

        {/* Title */}
        <motion.h2 
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-8"
        >
          Join Us on This Journey
        </motion.h2>

        {/* The Ask */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-md bg-gradient-to-r from-purple-500/20 to-sky-500/20 border border-purple-500/30 rounded-2xl px-8 py-6 mb-8 text-center"
        >
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">
            Raising
          </div>
          <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-1">
            $1.5M
          </div>
          <div className="text-gray-400">
            Seed Round • 18-Month Runway
          </div>
        </motion.div>

        {/* Founder Commitment Banner */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-10"
        >
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex-1 max-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">$600K</div>
              <div className="text-xs text-gray-400">Founder Investment</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex-1 max-w-[200px]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Patent</div>
              <div className="text-xs text-gray-400">Pending on Auto-Gift</div>
            </div>
          </div>
        </motion.div>

        {/* Use of Funds */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-xl mx-auto mb-10"
        >
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-4 text-center">
            Use of Funds
          </div>
          <div className="space-y-3">
            {useOfFunds.map((item, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{item.amount}</span>
                    <span className="text-white text-sm font-bold">{item.percentage}%</span>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2 bg-white/10" />
                <div className="text-gray-500 text-xs mt-1">{item.purpose}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Key Milestones */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-xl mx-auto mb-12"
        >
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-4 text-center">
            Key Milestones (18 Months)
          </div>
          <div className="flex items-center justify-center gap-8 md:gap-12 relative">
            {/* Connecting line - spans between dots */}
            <div className="absolute top-4 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-500/50 to-sky-500/50" />
            
            {milestones.map((milestone, index) => (
              <div key={index} className="relative flex flex-col items-center z-10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="text-white text-xs font-medium text-center whitespace-nowrap">{milestone.label}</div>
                <div className="text-gray-500 text-xs">{milestone.timeline}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
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
      </div>

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
