
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import { motion } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";

interface UnifiedAuthViewProps {
  initialMode?: "signin" | "signup";
  preFilledEmail?: string;
  invitationData?: {
    connectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
  } | null;
}

const UnifiedAuthView: React.FC<UnifiedAuthViewProps> = ({ 
  initialMode = "signup", 
  preFilledEmail,
  invitationData 
}) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialMode);

  const handleTabChange = (value: string) => {
    triggerHapticFeedback('selection');
    setActiveTab(value as "signin" | "signup");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Card className="w-full card-unified">
        <CardContent className="touch-padding-lg pb-safe">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-space-loose">
              <TabsTrigger value="signin" className="text-body font-medium touch-target-44 touch-manipulation">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-body font-medium touch-target-44 touch-manipulation">
                Get Started
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <motion.div 
                className="space-y-unified"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-space-loose">
                  <h2 className="text-heading-2 text-foreground">Welcome Back</h2>
                  <p className="text-body-sm text-muted-foreground mt-space-minimal">
                    {preFilledEmail ? 'Sign in with your new password' : 'Sign in to your account'}
                  </p>
                </div>
                <SignInForm preFilledEmail={preFilledEmail} />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="signup">
              <motion.div 
                className="space-y-unified"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-space-loose">
                  <h2 className="text-heading-2 text-foreground">Create Account</h2>
                  <p className="text-body-sm text-muted-foreground mt-space-minimal">
                    {invitationData ? `${invitationData.senderName} invited you to connect!` : 'Join thousands of thoughtful gift-givers'}
                  </p>
                </div>
                <SignUpForm invitationData={invitationData} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UnifiedAuthView;
