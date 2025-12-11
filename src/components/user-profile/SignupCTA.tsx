import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

interface SignupCTAProps {
  profileName: string;
  onDismiss: () => void;
}

const SignupCTA: React.FC<SignupCTAProps> = ({ profileName, onDismiss }) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate('/signup');
  };

  const handleDismiss = () => {
    triggerHapticFeedback('light');
    onDismiss();
  };

  return (
    <div className="fixed z-50 left-4 right-4 md:left-auto md:right-4 md:w-96" style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Join {profileName}'s community
                </h3>
              </div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Sign up to follow, message, and discover amazing gift ideas together!
            </p>
            
            <div className="flex space-x-2">
              <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                <Button onClick={handleSignup} className="w-full min-h-[44px]">
                  <Heart className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button variant="outline" onClick={handleDismiss} className="min-h-[44px]">
                  Maybe Later
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupCTA;
