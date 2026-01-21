import { motion } from 'framer-motion';
import { Mail, Calendar, ArrowRight, DollarSign, Shield, Megaphone, Code, Users, Target } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';
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
  { category: 'Product & Engineering', amount: '$450K', percentage: 30, icon: Code, purpose: 'Nicole AI, Auto-Gift engine' },
  { category: 'Operations & Hiring', amount: '$375K', percentage: 25, icon: Users, purpose: 'Core team expansion' },
];

const milestones = [
  { label: '100K Users', timeline: 'Q4 2026' },
  { label: '$1.3M Rev', timeline: 'Year 2' },
  { label: 'Marketplace', timeline: 'Q2 2026' },
  { label: 'Series A', timeline: 'Q4 2026' },
];

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
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4"
      >
        Join Us on This Journey
      </motion.h2>

      {/* The Ask */}
      <motion.div 
        variants={itemVariants}
        className="w-full max-w-xs bg-gradient-to-r from-purple-500/20 to-sky-500/20 border border-purple-500/30 rounded-xl px-6 py-4 mb-4 text-center"
      >
        <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">
          Raising
        </div>
        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-sky-400 bg-clip-text text-transparent mb-0.5">
          $1.5M
        </div>
        <div className="text-gray-400 text-xs">
          Seed Round • 18-Month Runway
        </div>
      </motion.div>

      {/* Founder Commitment Banner */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-center gap-2 mb-4"
      >
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white">$600K</div>
            <div className="text-[10px] text-gray-400">Founder Investment</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-base font-bold text-white">Patent</div>
            <div className="text-[10px] text-gray-400">Pending on Auto-Gift</div>
          </div>
        </div>
      </motion.div>

      {/* Use of Funds */}
      <motion.div 
        variants={itemVariants}
        className="w-full max-w-md mb-4"
      >
        <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 text-center">
          Use of Funds
        </div>
        <div className="space-y-2">
          {useOfFunds.map((item, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-3 h-3 text-purple-400" />
                  <span className="text-white text-xs font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[10px]">{item.amount}</span>
                  <span className="text-white text-xs font-bold">{item.percentage}%</span>
                </div>
              </div>
              <Progress value={item.percentage} className="h-1.5 bg-white/10" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Milestones */}
      <motion.div 
        variants={itemVariants}
        className="w-full max-w-md mb-6"
      >
        <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-2 text-center">
          Key Milestones (18 Months)
        </div>
        <div className="flex items-center justify-center gap-4 md:gap-6 relative">
          {/* Connecting line */}
          <div className="absolute top-3 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-purple-500/50 to-sky-500/50" />
          
          {milestones.map((milestone, index) => (
            <div key={index} className="relative flex flex-col items-center z-10">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center mb-1">
                <Target className="w-3 h-3 text-white" />
              </div>
              <div className="text-white text-[10px] font-medium text-center whitespace-nowrap">{milestone.label}</div>
              <div className="text-gray-500 text-[9px]">{milestone.timeline}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact buttons */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-center gap-2 mb-4"
      >
        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white px-4 text-sm"
          onClick={() => window.open('mailto:invest@elyphant.com', '_blank')}
        >
          <Mail className="w-4 h-4 mr-1.5" />
          invest@elyphant.com
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 px-4 text-sm"
          onClick={() => window.open('https://calendly.com', '_blank')}
        >
          <Calendar className="w-4 h-4 mr-1.5" />
          Schedule a Call
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center gap-4 text-gray-500 text-xs"
      >
        <a 
          href="https://elyphant.com" 
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          elyphant.com <ArrowRight className="w-2.5 h-2.5" />
        </a>
        <span>•</span>
        <span>Made with 💜 in 2026</span>
      </motion.div>
    </SlideWrapper>
  );
};

export default ContactSlide;
