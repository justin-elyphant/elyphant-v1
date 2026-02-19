import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Mail, ArrowRight } from "lucide-react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { triggerHapticFeedback } from "@/utils/haptics";

interface ConnectionsHeroSectionProps {
  friendsCount: number;
  pendingCount: number;
  userName?: string;
  onFindFriends: () => void;
  onInviteNew?: () => void;
  isMobile?: boolean;
}

const ConnectionsHeroSection: React.FC<ConnectionsHeroSectionProps> = ({
  friendsCount,
  pendingCount,
  userName,
  onFindFriends,
  onInviteNew,
  isMobile = false
}) => {
  const { profile } = useProfile();
  const displayName = userName || profile?.name?.split(' ')[0] || '';
  
  const springConfig = { type: "spring", stiffness: 300, damping: 25 };
  
  const padding = isMobile ? 'p-5' : 'p-8 lg:p-10';
  const titleSize = isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl';

  const handleFindFriends = () => {
    triggerHapticFeedback('light');
    onFindFriends();
  };

  const handleInviteNew = () => {
    triggerHapticFeedback('light');
    onInviteNew?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={isMobile ? "mb-4" : "mb-6"}
      style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
    >
      {/* Unified Gradient Hero Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-violet-600 to-sky-500 border-0 text-white touch-manipulation">
        <CardContent className={padding}>
          <Badge className="bg-white/20 text-white border-0 mb-3 lg:mb-4 backdrop-blur-sm text-xs">
            YOUR NETWORK
          </Badge>
          <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wide">My Connections</p>
          <h1 className={`${titleSize} font-bold mb-2 leading-tight`}>
            Welcome{displayName ? `, ${displayName}` : ''}!
          </h1>
          <p className="text-white/90 mb-4 lg:mb-6 leading-relaxed">
            You have{' '}
            <span className="font-bold text-white">{friendsCount}</span>{' '}
            {friendsCount === 1 ? 'connection' : 'connections'}
            {pendingCount > 0 && (
              <> and <span className="font-bold text-white">{pendingCount}</span> pending request{pendingCount !== 1 ? 's' : ''}</>
            )}. Build your gifting circle and never miss an occasion.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                onClick={handleFindFriends}
                className="bg-white text-purple-600 hover:bg-white/90 min-h-[44px] font-semibold w-full sm:w-auto touch-manipulation"
              >
                <Search className="h-4 w-4 mr-2" />
                Find Friends
              </Button>
            </motion.div>
            {onInviteNew && (
              <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
                <Button 
                  onClick={handleInviteNew}
                  variant="ghost" 
                  className="text-white hover:bg-white/10 min-h-[44px] w-full sm:w-auto touch-manipulation"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invite New
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ConnectionsHeroSection;
