import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SignupCTAProps {
  profileName: string;
  onDismiss: () => void;
}

const SignupCTA: React.FC<SignupCTAProps> = ({ profileName, onDismiss }) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Join {profileName}'s community
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Sign up to follow, message, and discover amazing gift ideas together!
          </p>
          
          <div className="flex space-x-2">
            <Button onClick={handleSignup} className="flex-1">
              <Heart className="h-4 w-4 mr-2" />
              Get Started
            </Button>
            <Button variant="outline" onClick={onDismiss}>
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupCTA;