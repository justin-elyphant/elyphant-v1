import { motion } from 'framer-motion';
import { Linkedin } from 'lucide-react';
import { slideVariants, itemVariants } from '../slideAnimations';

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
  // Add more team members as needed
];

const advisors = [
  { name: "Advisor 1", expertise: "E-commerce" },
  { name: "Advisor 2", expertise: "AI/ML" },
  { name: "Advisor 3", expertise: "Growth" },
];

const TeamSlide = ({ direction }: SlideProps) => {
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
        The Team
      </motion.span>

      {/* Title */}
      <motion.h2 
        variants={itemVariants}
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-12"
      >
        Built by Gift Givers
      </motion.h2>

      {/* Team members */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-8 mb-12"
      >
        {team.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.15 }}
            className="flex flex-col items-center text-center max-w-xs"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center mb-4 text-4xl font-bold text-white">
              {member.initials}
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {member.name}
            </h3>
            <p className="text-purple-400 text-sm mb-2">{member.role}</p>
            <p className="text-gray-500 text-sm mb-3">{member.bio}</p>
            <a 
              href={member.linkedin} 
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </motion.div>
        ))}
      </motion.div>

      {/* Advisors */}
      <motion.div variants={itemVariants} className="text-center">
        <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-4">
          Advisors
        </h4>
        <div className="flex flex-wrap justify-center gap-6">
          {advisors.map((advisor) => (
            <div 
              key={advisor.name}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"
            >
              <span className="text-white font-medium">{advisor.name}</span>
              <span className="text-gray-500 text-sm ml-2">• {advisor.expertise}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeamSlide;
