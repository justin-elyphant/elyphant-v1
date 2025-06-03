
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback } from "@/utils/haptics";
import ConversationalIntentDiscovery from "./ConversationalIntentDiscovery";
import NicoleGiftorFlow from "./NicoleGiftorFlow";
import NicoleGifteeFlow from "./NicoleGifteeFlow";
import ConnectionDiscoveryFlow from "./ConnectionDiscoveryFlow";
import OnboardingProgressTracker from "./OnboardingProgressTracker";

type OnboardingStep = 
  | "intent-discovery" 
  | "giftor-flow" 
  | "giftee-flow" 
  | "connection-discovery" 
  | "completion";

type UserIntent = "giftor" | "giftee" | "explorer";

interface NicoleOnboardingEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const NicoleOnboardingEngine: React.FC<NicoleOnboardingEngineProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("intent-discovery");
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  // Initialize onboarding with welcome message
  useEffect(() => {
    if (isOpen && conversationHistory.length === 0) {
      triggerHapticFeedback('light');
      setConversationHistory([{
        id: 1,
        role: 'assistant',
        content: "Hi! I'm Nicole, your AI gift assistant. I'm here to help you get the most out of Elyphant. What brings you here today?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, conversationHistory.length]);

  const handleIntentDiscovered = (intent: UserIntent, data: any) => {
    setUserIntent(intent);
    setOnboardingData(prev => ({ ...prev, ...data }));
    
    // Trigger haptic feedback for progression
    triggerHapticFeedback('selection');
    
    // Determine next step based on intent
    if (intent === "giftor") {
      setCurrentStep("giftor-flow");
    } else if (intent === "giftee") {
      setCurrentStep("giftee-flow");
    } else {
      setCurrentStep("connection-discovery");
    }
  };

  const handleFlowComplete = (flowData: any) => {
    setOnboardingData(prev => ({ ...prev, ...flowData }));
    triggerHapticFeedback('medium');
    
    // Move to connection discovery if not already there
    if (currentStep !== "connection-discovery") {
      setCurrentStep("connection-discovery");
    } else {
      setCurrentStep("completion");
    }
  };

  const handleConnectionsComplete = (connectionData: any) => {
    setOnboardingData(prev => ({ ...prev, ...connectionData }));
    setCurrentStep("completion");
    triggerHapticFeedback('heavy');
    
    // Complete onboarding after a brief delay
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleSkip = () => {
    triggerHapticFeedback('light');
    onComplete();
  };

  const addToConversation = (message: any) => {
    setConversationHistory(prev => [...prev, { ...message, id: Date.now(), timestamp: new Date() }]);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "intent-discovery":
        return (
          <ConversationalIntentDiscovery
            conversationHistory={conversationHistory}
            onIntentDiscovered={handleIntentDiscovered}
            onAddMessage={addToConversation}
            onSkip={handleSkip}
          />
        );
      
      case "giftor-flow":
        return (
          <NicoleGiftorFlow
            conversationHistory={conversationHistory}
            initialData={onboardingData}
            onComplete={handleFlowComplete}
            onAddMessage={addToConversation}
            onBack={() => setCurrentStep("intent-discovery")}
          />
        );
      
      case "giftee-flow":
        return (
          <NicoleGifteeFlow
            conversationHistory={conversationHistory}
            initialData={onboardingData}
            onComplete={handleFlowComplete}
            onAddMessage={addToConversation}
            onBack={() => setCurrentStep("intent-discovery")}
          />
        );
      
      case "connection-discovery":
        return (
          <ConnectionDiscoveryFlow
            conversationHistory={conversationHistory}
            userIntent={userIntent}
            onComplete={handleConnectionsComplete}
            onAddMessage={addToConversation}
            onSkip={() => handleConnectionsComplete({})}
          />
        );
      
      case "completion":
        return (
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to Elyphant!
            </h3>
            <p className="text-gray-600">
              Nicole has everything set up for you. Let's start your gifting journey!
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 ios-modal-backdrop">
      <div className={`
        absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl
        ${isMobile ? 'h-[90vh]' : 'h-[80vh] max-w-md mx-auto mb-8 rounded-3xl'}
        transition-transform duration-300 ease-out
        safe-area-bottom
      `}>
        {/* Progress Tracker */}
        <OnboardingProgressTracker
          currentStep={currentStep}
          userIntent={userIntent}
        />
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default NicoleOnboardingEngine;
