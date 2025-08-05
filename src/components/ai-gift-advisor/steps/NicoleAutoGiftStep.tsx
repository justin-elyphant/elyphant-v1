import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Users, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type NicoleAutoGiftStepProps = ReturnType<typeof useGiftAdvisorBot>;

const NicoleAutoGiftStep = ({ 
  nextStep, 
  setBudget, 
  setOccasion, 
  botState 
}: NicoleAutoGiftStepProps) => {
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<"auto-pilot" | "curated" | null>(null);

  const recipientName = botState.selectedFriend?.name || 
    botState.recipientDetails?.name || "them";

  const handleAutoPilot = async () => {
    setSelectedPath("auto-pilot");
    
    // Transition to connection selection for auto-pilot
    nextStep("nicole-auto-gift-connection");
  };

  const handleCurated = () => {
    setSelectedPath("curated");
    nextStep("occasion");
  };

  return (
    <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-6">
      <div className="relative">
        <Sparkles className="h-16 w-16 text-purple-500 mx-auto animate-pulse" />
        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-xs">
          Smart
        </Badge>
      </div>
      
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">
          Perfect, {user?.user_metadata?.first_name || "there"}! 
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          I can handle everything for gifting {recipientName}. Would you like me to pick the perfect gift for you, or would you prefer to help curate the selection together?
        </p>
      </div>

      <div className="w-full space-y-3">
        {/* Auto-Pilot Path */}
        <Card 
          className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg group ${
            selectedPath === "auto-pilot" ? "border-primary bg-primary/5" : "hover:border-primary/50"
          }`}
          onClick={handleAutoPilot}
        >
          <CardContent className="p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Let Nicole Handle It</h3>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                Recommended
              </Badge>
            </div>
            <p className="text-xs text-gray-600">
              I'll pick the perfect gift based on your relationship and deliver it automatically
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-purple-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>30 seconds</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>AI-powered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Curated Path */}
        <Card 
          className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg group ${
            selectedPath === "curated" ? "border-blue-500 bg-blue-50" : "hover:border-blue-500/50"
          }`}
          onClick={handleCurated}
        >
          <CardContent className="p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Let's Curate Together</h3>
            </div>
            <p className="text-xs text-gray-600">
              I'll ask a few questions to help find exactly what {recipientName} would love
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-blue-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>2-3 minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Personalized</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Both options create the same amazing auto-gifting experience, {user?.user_metadata?.first_name}
        </p>
      </div>
    </div>
  );
};

export default NicoleAutoGiftStep;