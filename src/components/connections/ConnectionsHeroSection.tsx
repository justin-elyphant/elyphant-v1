import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Link2, Share2 } from "lucide-react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileSharing } from "@/hooks/useProfileSharing";
import { triggerHapticFeedback } from "@/utils/haptics";
import { toast } from "sonner";
import { useBetaCredits } from "@/hooks/useBetaCredits";

interface ConnectionsHeroSectionProps {
  friendsCount: number;
  pendingCount: number;
  userName?: string;
  onInvite: () => void;
  isMobile?: boolean;
}

const ConnectionsHeroSection: React.FC<ConnectionsHeroSectionProps> = ({
  friendsCount,
  pendingCount,
  userName,
  onInvite,
  isMobile = false
}) => {
  const { profile } = useProfile();
  const { balance: betaCreditBalance } = useBetaCredits();
  const isBetaTester = betaCreditBalance > 0;
  const displayName = userName || profile?.name?.split(' ')[0] || '';
  
  const { quickShare, profileUrl } = useProfileSharing({
    profileId: profile?.id || '',
    profileName: profile?.name || '',
    profileUsername: profile?.username || undefined,
    isBetaTester
  });

  const springConfig = { type: "spring", stiffness: 300, damping: 25 };
  
  const padding = isMobile ? 'p-5' : 'p-8 lg:p-10';
  const titleSize = isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl';

  const handleInvite = () => {
    triggerHapticFeedback('light');
    if (isMobile) {
      quickShare();
    } else {
      onInvite();
    }
  };

  const handleShareLink = async () => {
    triggerHapticFeedback('light');
    await quickShare();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={isMobile ? "mb-4" : "mb-6"}
      style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
    >
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
            )}.{' '}
            {isBetaTester 
              ? <>Share your link and earn <span className="font-bold text-white">$100</span> for every friend who joins.</>
              : <>Share your link and grow your gifting network.</>
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                onClick={handleInvite}
                className="bg-white text-purple-600 hover:bg-white/90 min-h-[44px] font-semibold w-full sm:w-auto touch-manipulation"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isBetaTester ? 'Invite a Friend, Get $100' : 'Invite a Friend'}
              </Button>
            </motion.div>
            {!isMobile && (
              <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
                <Button 
                  onClick={handleShareLink}
                  variant="ghost" 
                  className="text-white hover:bg-white/10 min-h-[44px] w-full sm:w-auto touch-manipulation"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Invite Link
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
