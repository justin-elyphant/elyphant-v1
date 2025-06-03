
import React, { useState } from "react";
import NameInputStep from "./steps/NameInputStep";
import BirthdayInputStep from "./steps/BirthdayInputStep";
import InterestsInputStep from "./steps/InterestsInputStep";

interface NicoleGifteeFlowProps {
  conversationHistory: any[];
  initialData: any;
  onComplete: (data: any) => void;
  onAddMessage: (message: any) => void;
  onBack: () => void;
}

const NicoleGifteeFlow: React.FC<NicoleGifteeFlowProps> = ({
  conversationHistory,
  initialData,
  onComplete,
  onAddMessage,
  onBack
}) => {
  const [step, setStep] = useState(0);
  const [collectedData, setCollectedData] = useState({
    interests: [] as string[],
    birthday: "",
    name: "",
    wishlist_preferences: [] as string[]
  });

  const handleInterestAdd = (interest: string) => {
    if (interest && !collectedData.interests.includes(interest)) {
      setCollectedData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const handleBirthdayChange = (month: string, day: string) => {
    if (month && day) {
      const birthday = `${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      setCollectedData(prev => ({ ...prev, birthday }));
    }
  };

  const handleComplete = () => {
    onAddMessage({
      role: 'assistant',
      content: "Wonderful! Your wishlist profile is ready to go. I've set up everything so friends and family can easily find gifts you'll love. Now let's connect you with others so they know about your preferences and upcoming occasions!"
    });

    // Enhanced data structure for Profile Setup with proper formatting
    const standardizedData = {
      name: collectedData.name,
      birthday: collectedData.birthday, // Format: MM-DD
      interests: collectedData.interests,
      userType: 'giftee',
      wishlist_preferences: collectedData.wishlist_preferences,
      // Add profile data in the exact format Profile Setup expects
      profile_data: {
        name: collectedData.name,
        dob: collectedData.birthday, // This should match the dob field in Profile Setup
        gift_preferences: collectedData.interests.map(interest => ({
          category: interest,
          importance: 'medium'
        })),
        // Add important dates if birthday is provided
        important_dates: collectedData.birthday ? [{
          title: "Birthday",
          date: `2024-${collectedData.birthday}`, // Add year for proper date format
          type: "birthday"
        }] : []
      }
    };

    console.log("[Nicole Giftee] Collecting enhanced data for Profile Setup:", standardizedData);
    
    // Store in localStorage with clear naming
    localStorage.setItem("nicoleCollectedData", JSON.stringify(standardizedData));
    
    // Also store a flag to indicate Nicole completed
    localStorage.setItem("nicoleDataReady", "true");
    
    setTimeout(() => {
      onComplete({ 
        gifteeSetup: true,
        userData: standardizedData
      });
    }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <NameInputStep
            name={collectedData.name}
            onNameChange={(name) => setCollectedData(prev => ({ ...prev, name }))}
            onContinue={() => setStep(1)}
            onBack={onBack}
            conversationHistory={conversationHistory}
          />
        );
      
      case 1:
        return (
          <BirthdayInputStep
            name={collectedData.name}
            birthday={collectedData.birthday}
            onBirthdayChange={handleBirthdayChange}
            onContinue={() => setStep(2)}
            onBack={() => setStep(0)}
            conversationHistory={conversationHistory}
          />
        );

      case 2:
        return (
          <InterestsInputStep
            interests={collectedData.interests}
            onInterestAdd={handleInterestAdd}
            onComplete={handleComplete}
            onBack={() => setStep(1)}
            conversationHistory={conversationHistory}
          />
        );

      default:
        return null;
    }
  };

  return renderStep();
};

export default NicoleGifteeFlow;
