
import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Users, Sparkles } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type WelcomeStepProps = ReturnType<typeof useGiftAdvisorBot>;

const WelcomeStep = ({ nextStep }: WelcomeStepProps) => {
  return (
    <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-6">
      <div className="relative">
        <Gift className="h-16 w-16 text-purple-500 mx-auto animate-bounce" />
        <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900">
          Hey there! I'm Nicole 👋
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          I'll help you set up automatic gift-giving so you never miss an important celebration. Let me ask you a few quick questions to get started.
        </p>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Smart Suggestions</span>
        </div>
        <p className="text-xs text-purple-700">
          I'll use your connections and smart defaults to make this super easy for you!
        </p>
      </div>

      <Button 
        onClick={() => nextStep("recipient-selection")}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        Let's Do This!
      </Button>
    </div>
  );
};

export default WelcomeStep;
