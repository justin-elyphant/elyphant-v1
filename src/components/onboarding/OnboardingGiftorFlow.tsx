
import React, { useState } from "react";
import SimplifiedGiftorOnboarding from "./SimplifiedGiftorOnboarding";
import NicoleOnboardingEngine from "./nicole/NicoleOnboardingEngine";
import MainLayout from "@/components/layout/MainLayout";

const OnboardingGiftorFlow = () => {
  const [showNicoleFlow, setShowNicoleFlow] = useState(false);

  // Check if user came from Nicole onboarding
  React.useEffect(() => {
    const fromNicole = localStorage.getItem("nicoleOnboardingCompleted") === "true";
    if (fromNicole) {
      setShowNicoleFlow(false);
      localStorage.removeItem("nicoleOnboardingCompleted");
    }
  }, []);

  const handleNicoleComplete = () => {
    localStorage.setItem("nicoleOnboardingCompleted", "true");
    setShowNicoleFlow(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 flex flex-col">
        <div className="w-full max-w-4xl mx-auto mt-8">
          {/* Progress indicator to show this is part of onboarding */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">
                Step 2 of onboarding
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <SimplifiedGiftorOnboarding />
          </div>
        </div>
      </div>

      {/* Nicole Onboarding Engine for enhanced experience */}
      <NicoleOnboardingEngine
        isOpen={showNicoleFlow}
        onComplete={handleNicoleComplete}
        onClose={handleNicoleComplete}
      />
    </MainLayout>
  );
};

export default OnboardingGiftorFlow;
