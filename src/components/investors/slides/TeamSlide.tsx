import { motion } from 'framer-motion';
import { Linkedin } from 'lucide-react';
import SlideWrapper from './SlideWrapper';
import { itemVariants } from '../slideAnimations';

interface SlideProps {
  direction: number;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const team = [
  {
    name: "Your Name",
    role: "Founder & CEO",
    bio: "Passionate about strengthening human connections through technology",
    linkedin: "#",
    initials: "YN",
  },
];

const advisors = [
  { name: "Advisor 1", expertise: "E-commerce" },
  { name: "Advisor 2", expertise: "AI/ML" },
  { name: "Advisor 3", expertise: "Growth" },
];

const TeamSlide = ({ direction }: SlideProps) => {
  return (
    <SlideWrapper direction={direction}>
      {/* Section label */}
      <motion.span 
        variants={itemVariants}
        className="text-purple-400 uppercase tracking-widest text-xs md:text-sm mb-3"
      >
        The Team
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-6 md:mb-8"
      >
        Built by Gift Givers
      </motion.h2>

      {/* Team members */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-6 mb-8"
      >
        {team.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="flex flex-col items-center text-center max-w-[200px]"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center mb-3 text-2xl md:text-3xl font-bold text-white">
              {member.initials}
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-0.5">
              {member.name}
            </h3>
            <p className="text-purple-400 text-xs md:text-sm mb-1">{member.role}</p>
            <p className="text-gray-500 text-xs mb-2">{member.bio}</p>
            <a 
              href={member.linkedin} 
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* Advisors */}
      <motion.div variants={itemVariants} className="text-center w-full">
        <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
          Advisors
        </h4>
        <div className="flex flex-wrap justify-center gap-3">
          {advisors.map((advisor) => (
            <div 
              key={advisor.name}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
            >
              <span className="text-white text-sm font-medium">{advisor.name}</span>
              <span className="text-gray-500 text-xs ml-1.5">• {advisor.expertise}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  );
};

export default TeamSlide;
