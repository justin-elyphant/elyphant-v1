
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

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

  return (
    <Card className="w-full card-unified">
      <CardContent className="touch-padding-lg">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 mb-space-loose">
            <TabsTrigger value="signin" className="text-body font-medium touch-target-44">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-body font-medium touch-target-44">
              Get Started
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <div className="space-y-unified">
              <div className="text-center mb-space-loose">
                <h2 className="text-heading-2 text-foreground">Welcome Back</h2>
                <p className="text-body-sm text-muted-foreground mt-space-minimal">
                  {preFilledEmail ? 'Sign in with your new password' : 'Sign in to your account'}
                </p>
              </div>
              <SignInForm preFilledEmail={preFilledEmail} />
            </div>
          </TabsContent>
          
          <TabsContent value="signup">
            <div className="space-y-unified">
              <div className="text-center mb-space-loose">
                <h2 className="text-heading-2 text-foreground">Create Account</h2>
                <p className="text-body-sm text-muted-foreground mt-space-minimal">
                  {invitationData ? `${invitationData.senderName} invited you to connect!` : 'Join thousands of thoughtful gift-givers'}
                </p>
              </div>
              <SignUpForm invitationData={invitationData} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UnifiedAuthView;
