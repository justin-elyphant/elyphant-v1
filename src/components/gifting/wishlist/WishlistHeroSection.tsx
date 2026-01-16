import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Plus, ShoppingBag, Share2, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

interface WishlistHeroSectionProps {
  wishlistCount: number;
  totalItemCount: number;
  onCreateWishlist: () => void;
  onHowItWorks?: () => void;
  variant?: 'full' | 'mobile';
}

const WishlistHeroSection: React.FC<WishlistHeroSectionProps> = ({
  wishlistCount,
  totalItemCount,
  onCreateWishlist,
  onHowItWorks,
  variant = 'full'
}) => {
  const { profile } = useProfile();
  const navigate = useNavigate();

  const springConfig = { type: "spring", stiffness: 300, damping: 25 };
  
  // Mobile variant - full content but optimized spacing
  const isMobile = variant === 'mobile';
  const padding = isMobile ? 'p-5' : 'p-8 lg:p-10';
  const titleSize = isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl';
  const subtitleSize = isMobile ? 'text-sm' : 'text-base';

  const handleCreateClick = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    onCreateWishlist();
  };

  const handleBrowseClick = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate('/marketplace');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={isMobile ? "" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}
      style={{ transform: 'translate3d(0,0,0)' }}
    >
      {/* Coral/Pink Hero Card - warm gradient with white text */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-[#F97066] via-[#FB923C] to-[#FDBA74] border-0 text-white">
        <CardContent className={padding}>
          <Badge className="bg-white/20 text-white border-0 mb-3 lg:mb-4 text-xs font-medium">
            YOUR LISTS
          </Badge>
          <h1 className={`${titleSize} font-bold mb-3 lg:mb-4 leading-tight text-white`}>
            My Wishlists
          </h1>
          <p className={`${subtitleSize} text-white/90 mb-4 lg:mb-6 leading-relaxed`}>
            Build your dream collections and share with friends and family. 
            The perfect way to never receive a gift you don't love.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                onClick={handleCreateClick}
                className="bg-white hover:bg-white/90 text-[#FF6B6B] border-0 min-h-[48px] font-semibold w-full sm:w-auto touch-manipulation shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Wishlist
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                onClick={handleBrowseClick}
                className="bg-white/20 hover:bg-white/30 border-2 border-white text-white min-h-[48px] w-full sm:w-auto touch-manipulation"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Marketplace
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </div>
          
          {/* Stats on mobile - shown below CTAs */}
          {isMobile && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-white/80">
                <span className="font-semibold text-white">{wishlistCount}</span> {wishlistCount === 1 ? 'wishlist' : 'wishlists'} · <span className="font-semibold text-white">{totalItemCount}</span> items
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Stats Card - Only shown on desktop (lg+) */}
      {!isMobile && (
        <Card className="bg-background hidden lg:block border border-border/50">
          <CardContent className="p-8 lg:p-10">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
                </h2>
                <p className="text-muted-foreground">
                  You have <span className="font-semibold text-foreground">{wishlistCount}</span> wishlist{wishlistCount !== 1 ? 's' : ''} with <span className="font-semibold text-foreground">{totalItemCount}</span> total items
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-muted">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Share & Get What You Want</p>
                    <p className="text-xs text-muted-foreground">
                      Make lists public and share with friends for any occasion
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-muted">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Avoid Duplicate Gifts</p>
                    <p className="text-xs text-muted-foreground">
                      Friends see when items are purchased so no surprises are ruined
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
                      Your wishlists help our AI suggest perfect gifts for you
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

export default WishlistHeroSection;
