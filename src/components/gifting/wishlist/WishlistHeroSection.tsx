import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Plus, ShoppingBag, ArrowRight } from "lucide-react";
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
      style={{ transform: 'translate3d(0,0,0)' }}
    >
      {/* Clean monochromatic hero card */}
      <Card className="relative overflow-hidden bg-muted/50 border-border/40">
        <CardContent className={padding}>
          {/* Welcome greeting */}
          <p className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-wide">My Wishlists</p>
          <h1 className={`${titleSize} font-bold mb-1 leading-tight text-foreground`}>
            Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
          </h1>
          <p className={`${subtitleSize} text-muted-foreground mb-4 lg:mb-5 leading-relaxed`}>
            You have{' '}
            <span className="font-semibold text-foreground">{wishlistCount}</span>{' '}
            {wishlistCount === 1 ? 'wishlist' : 'wishlists'} with{' '}
            <span className="font-semibold text-foreground">{totalItemCount}</span> total items.
            Build your collections and share with friends &amp; family.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                onClick={handleCreateClick}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0 min-h-[48px] font-semibold w-full sm:w-auto touch-manipulation shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Wishlist
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
              <Button 
                variant="outline"
                onClick={handleBrowseClick}
                className="min-h-[48px] w-full sm:w-auto touch-manipulation"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Marketplace
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WishlistHeroSection;
