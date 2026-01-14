import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Gift, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";
import SignUpDialog from "@/components/marketplace/SignUpDialog";

const ConnectionsCTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  
  // Only fetch connections if user is logged in
  const { friends } = useConnectionsAdapter();
  const connectionCount = user ? (Array.isArray(friends) ? friends.length : 0) : 0;

  const handleFindFriends = () => {
    triggerHapticFeedback('light');
    if (!user) {
      setShowSignUpDialog(true);
      return;
    }
    navigate("/connections");
  };

  const handleLearnMore = () => {
    triggerHapticFeedback('light');
    navigate("/connections");
  };

  const springConfig = { type: "spring", stiffness: 300, damping: 25 };

  const benefits = [
    {
      icon: Gift,
      title: "See Their Wishlists",
      description: "Know exactly what your friends want"
    },
    {
      icon: Calendar,
      title: "Track Special Dates",
      description: "Never miss a birthday or anniversary"
    },
    {
      icon: Users,
      title: "AI-Powered Recommendations",
      description: "Better connections = smarter gift ideas"
    }
  ];

  return (
    <FullBleedSection className="py-12 md:py-16 lg:py-20">
      <div className="container-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
            style={{ transform: 'translate3d(0,0,0)' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Build Your Circle</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Know When
              </span>
              {" "}to Gift
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-lg">
              Connect with friends and family to see their wishlists and never 
              miss a birthday, anniversary, or special occasion again.
            </p>

            {/* Dynamic message based on auth state */}
            {user && connectionCount > 0 && (
              <p className="text-sm text-muted-foreground">
                You have <span className="font-semibold text-foreground">{connectionCount}</span> connection{connectionCount !== 1 ? 's' : ''}. 
                See their wishlists and upcoming events.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
                <Button 
                  onClick={handleFindFriends}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] font-semibold w-full sm:w-auto touch-manipulation"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Friends
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }} transition={springConfig}>
                <Button 
                  onClick={handleLearnMore}
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] w-full sm:w-auto touch-manipulation"
                >
                  Learn How It Works
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Benefits cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
            style={{ transform: 'translate3d(0,0,0)' }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors touch-manipulation"
                style={{ transform: 'translate3d(0,0,0)' }}
              >
                <div className="p-3 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex-shrink-0">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Sign up dialog for unauthenticated users */}
      <SignUpDialog 
        open={showSignUpDialog} 
        onOpenChange={setShowSignUpDialog}
      />
    </FullBleedSection>
  );
};

export default ConnectionsCTA;
