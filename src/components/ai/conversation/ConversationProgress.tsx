
import React from "react";
import { Badge } from "@/components/ui/badge";

interface ConversationProgressProps {
  step: string;
}

const ConversationProgress: React.FC<ConversationProgressProps> = ({ step }) => {
  const getStepInfo = (currentStep: string) => {
    switch (currentStep) {
      case "greeting":
        return { label: "Starting", progress: 20 };
      case "recipient":
        return { label: "Who", progress: 40 };
      case "occasion":
        return { label: "Occasion", progress: 60 };
      case "budget":
        return { label: "Budget", progress: 80 };
      case "interests":
        return { label: "Interests", progress: 90 };
      case "complete":
        return { label: "Ready!", progress: 100 };
      default:
        return { label: "Starting", progress: 20 };
    }
  };

  const { label, progress } = getStepInfo(step);

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <Badge variant="secondary" className="text-xs">
        {label}
      </Badge>
    </div>
  );
};

export default ConversationProgress;
