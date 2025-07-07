import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Sparkles, Gift, Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CoreNicoleExperienceProps {
  className?: string;
  compact?: boolean;
  showFeatures?: boolean;
  triggerSource?: 'dashboard' | 'marketplace' | 'onboarding';
}

const CoreNicoleExperience: React.FC<CoreNicoleExperienceProps> = ({
  className,
  compact = false,
  showFeatures = true,
  triggerSource = 'dashboard'
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleStartChat = () => {
    const params = new URLSearchParams({
      mode: 'nicole',
      open: 'true',
      greeting: 'core_experience',
      source: triggerSource
    });
    
    navigate(`/marketplace?${params.toString()}`);
  };

  const features = [
    {
      icon: Sparkles,
      title: "Smart Recommendations",
      description: "AI-powered gift suggestions based on your connections and their interests"
    },
    {
      icon: Gift,
      title: "Connection-Aware",
      description: "Knows your friends' wishlists and upcoming events automatically"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get personalized gift ideas in seconds, not hours"
    }
  ];

  if (compact) {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
          isHovered && "scale-105 shadow-purple-200",
          className
        )}
        onClick={handleStartChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Ask Nicole</h3>
                <p className="text-sm text-white/80">Your AI gift advisor</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Meet Nicole
        </CardTitle>
        <CardDescription className="text-lg">
          Your intelligent gift advisor powered by AI
        </CardDescription>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 w-fit mx-auto">
          Core Feature
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Nicole understands your connections, their interests, and upcoming events to suggest perfect gifts every time.
          </p>
          
          <Button
            onClick={handleStartChat}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full transition-all duration-200 hover:scale-105"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Start Chatting with Nicole
          </Button>
        </div>

        {showFeatures && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-4 rounded-lg bg-white/50 border border-purple-100"
                >
                  <div className="bg-purple-100 rounded-full p-3 w-fit mx-auto mb-3">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoreNicoleExperience;