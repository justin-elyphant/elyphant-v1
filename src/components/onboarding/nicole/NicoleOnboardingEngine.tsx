
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback } from "@/utils/haptics";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConversationalIntentDiscovery from "./ConversationalIntentDiscovery";
import NicoleGiftorFlow from "./NicoleGiftorFlow";
import NicoleGifteeFlow from "./NicoleGifteeFlow";
import ConnectionDiscoveryFlow from "./ConnectionDiscoveryFlow";
import OnboardingProgressTracker from "./OnboardingProgressTracker";
import NicoleOnboardingErrorBoundary from "./NicoleOnboardingErrorBoundary";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced initialization to prevent rapid state changes
  useEffect(() => {
    if (!isOpen) return;

    const initializeTimer = setTimeout(() => {
      if (!isInitialized) {
        console.log("Initializing Nicole onboarding with delay");
        
        triggerHapticFeedback('light');
        setConversationHistory([{
          id: 1,
          role: 'assistant',
          content: "Hi! I'm Nicole, your AI gift assistant. I'm here to help you get the most out of Elyphant. What brings you here today?",
          timestamp: new Date()
        }]);
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 300); // Small delay to prevent rapid state changes

    return () => clearTimeout(initializeTimer);
  }, [isOpen, isInitialized]);

  // Stable cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      const cleanupTimer = setTimeout(() => {
        setIsInitialized(false);
        setCurrentStep("intent-discovery");
        setUserIntent(null);
        setOnboardingData({});
        setConversationHistory([]);
        setIsLoading(true);
      }, 100);

      return () => clearTimeout(cleanupTimer);
    }
  }, [isOpen]);

  const handleIntentDiscovered = useCallback((intent: UserIntent, data: any) => {
    console.log("Intent discovered:", intent, data);
    
    setUserIntent(intent);
    setOnboardingData(prev => ({ ...prev, ...data }));
    
    // Store intent in localStorage
    localStorage.setItem("userIntent", intent);
    
    triggerHapticFeedback('selection');
    
    // Determine next step based on intent
    if (intent === "giftor") {
      setCurrentStep("giftor-flow");
    } else if (intent === "giftee") {
      setCurrentStep("giftee-flow");
    } else {
      setCurrentStep("connection-discovery");
    }
  }, []);

  const handleFlowComplete = useCallback((flowData: any) => {
    console.log("Flow completed:", flowData);
    
    setOnboardingData(prev => ({ ...prev, ...flowData }));
    triggerHapticFeedback('medium');
    
    if (currentStep !== "connection-discovery") {
      setCurrentStep("connection-discovery");
    } else {
      setCurrentStep("completion");
    }
  }, [currentStep]);

  const handleConnectionsComplete = useCallback((connectionData: any) => {
    console.log("Connections completed:", connectionData);
    
    setOnboardingData(prev => ({ ...prev, ...connectionData }));
    setCurrentStep("completion");
    triggerHapticFeedback('heavy');
    
    setTimeout(() => {
      onComplete();
    }, 1500);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    console.log("Skipping Nicole onboarding");
    
    triggerHapticFeedback('light');
    localStorage.setItem("userIntent", "explorer");
    onComplete();
  }, [onComplete]);

  const addToConversation = useCallback((message: any) => {
    setConversationHistory(prev => [...prev, { ...message, id: Date.now(), timestamp: new Date() }]);
  }, []);

  const handleError = useCallback(() => {
    console.log("Error in Nicole onboarding, completing");
    onComplete();
  }, [onComplete]);

  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Nicole...</p>
          </div>
        </div>
      );
    }

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
    <NicoleOnboardingErrorBoundary onError={handleError}>
      <div className="fixed inset-0 bg-black/50 z-50 ios-modal-backdrop">
        <div className={`
          absolute bg-white shadow-2xl transition-transform duration-300 ease-out
          ${isMobile 
            ? 'bottom-0 left-0 right-0 h-[90vh] rounded-t-3xl safe-area-bottom' 
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[700px] rounded-3xl'
          }
        `}>
          {/* Progress Tracker */}
          <OnboardingProgressTracker
            currentStep={currentStep}
            userIntent={userIntent}
          />
          
          {/* Scrollable Content Container */}
          <div className="flex-1 flex flex-col" style={{ height: 'calc(100% - 120px)' }}>
            <ScrollArea className="flex-1 h-full">
              <div className="h-full">
                {renderCurrentStep()}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </NicoleOnboardingErrorBoundary>
  );
};

export default NicoleOnboardingEngine;
