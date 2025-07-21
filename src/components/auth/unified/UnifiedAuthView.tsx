
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

const UnifiedAuthView = () => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");

  return (
    <Card className="w-full bg-background shadow-lg border border-border">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin" className="font-medium">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="font-medium">
              Get Started
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Welcome Back</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in to your account
                </p>
              </div>
              <SignInForm />
            </div>
          </TabsContent>
          
          <TabsContent value="signup">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Create Account</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Join thousands of thoughtful gift-givers
                </p>
              </div>
              <SignUpForm />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UnifiedAuthView;
