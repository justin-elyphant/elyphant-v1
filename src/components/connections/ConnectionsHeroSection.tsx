import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Gift, Calendar, Sparkles, ArrowRight, Heart } from "lucide-react";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { triggerHapticFeedback } from "@/utils/haptics";

interface ConnectionsHeroSectionProps {
  friendsCount: number;
  pendingCount: number;
  userName?: string;
  onFindFriends: () => void;
  onImportContacts?: () => void;
  isMobile?: boolean;
}

const ConnectionsHeroSection: React.FC<ConnectionsHeroSectionProps> = ({
  friendsCount,
  pendingCount,
  userName,
  onFindFriends,
  onImportContacts,
  isMobile = false
}) => {
  const { profile } = useProfile();
  const displayName = userName || profile?.name?.split(' ')[0] || '';
  
  const springConfig = { type: "spring", stiffness: 300, damping: 25 };
  
  const padding = isMobile ? 'p-5' : 'p-8 lg:p-10';
  const titleSize = isMobile ? 'text-2xl' : 'text-3xl lg:text-5xl';
  const subtitleSize = isMobile ? 'text-sm' : 'text-lg';

  const handleFindFriends = () => {
    triggerHapticFeedback('light');
    onFindFriends();
  };

  const handleImportContacts = () => {
    triggerHapticFeedback('light');
    onImportContacts?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={isMobile ? "mb-4" : "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"}
      style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
    >
      {/* Gradient Hero Card - Purple to Sky brand gradient */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-violet-600 to-sky-500 border-0 text-white touch-manipulation">
        <CardContent className={padding}>
          <Badge className="bg-white/20 text-white border-0 mb-3 lg:mb-4 backdrop-blur-sm text-xs">
            YOUR NETWORK
          </Badge>
          <h1 className={`${titleSize} font-bold mb-3 lg:mb-4 leading-tight`}>
            My Connections
          </h1>
          <p className={`${subtitleSize} text-white/90 mb-4 lg:mb-6 leading-relaxed`}>
            Build your gifting circle. See friends' wishlists, know their special 
            dates, and never miss an occasion to show you care.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                onClick={handleFindFriends}
                className="bg-white text-purple-600 hover:bg-white/90 min-h-[44px] font-semibold w-full sm:w-auto touch-manipulation"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Find Friends
              </Button>
            </motion.div>
            {onImportContacts && (
              <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
                <Button 
                  onClick={handleImportContacts}
                  variant="ghost" 
                  className="text-white hover:bg-white/10 min-h-[44px] w-full sm:w-auto touch-manipulation"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Import Contacts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
          
          {/* Stats on mobile - shown below CTAs */}
          {isMobile && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-white/80">
                <span className="font-semibold text-white">{friendsCount}</span> {friendsCount === 1 ? 'connection' : 'connections'}
                {pendingCount > 0 && (
                  <> · <span className="font-semibold text-white">{pendingCount}</span> pending</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Stats Card - Only shown on desktop (lg+) */}
      {!isMobile && (
        <Card className="bg-background hidden lg:block">
          <CardContent className="p-8 lg:p-10">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome{displayName ? `, ${displayName}` : ''}
                </h2>
                <p className="text-muted-foreground">
                  You have <span className="font-semibold text-foreground">{friendsCount}</span> connection{friendsCount !== 1 ? 's' : ''}
                  {pendingCount > 0 && (
                    <> and <span className="font-semibold text-foreground">{pendingCount}</span> pending request{pendingCount !== 1 ? 's' : ''}</>
                  )}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-muted">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">See Their Wishlists</p>
                    <p className="text-xs text-muted-foreground">
                      Browse what friends actually want before you shop
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Know Their Special Dates</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified about upcoming birthdays and anniversaries
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-muted">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Power AI Recommendations</p>
                    <p className="text-xs text-muted-foreground">
                      More connections = smarter gift suggestions from Nicole
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ConnectionsHeroSection;
