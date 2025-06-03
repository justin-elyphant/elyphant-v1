
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

    console.log("[Nicole Giftee] Raw collected data:", collectedData);

    // Enhanced data structure with proper formatting for Profile Setup
    const standardizedData = {
      name: collectedData.name,
      birthday: collectedData.birthday, // Format: MM-DD
      interests: collectedData.interests,
      userType: 'giftee',
      wishlist_preferences: collectedData.wishlist_preferences,
      // Enhanced profile data structure for better integration
      profile_data: {
        name: collectedData.name,
        // Convert MM-DD to proper date format for profile setup
        dob: collectedData.birthday ? `2024-${collectedData.birthday}` : null,
        bio: collectedData.name ? `Hi, I'm ${collectedData.name}! I love thoughtful gifts.` : "",
        gift_preferences: collectedData.interests.map(interest => ({
          category: interest,
          importance: 'medium'
        })),
        interests: collectedData.interests,
        // Add important dates if birthday is provided
        important_dates: collectedData.birthday ? [{
          title: "Birthday",
          date: `2024-${collectedData.birthday}`,
          type: "birthday"
        }] : [],
        // Add shipping address placeholder
        shipping_address: {
          address_line1: "",
          city: "",
          state: "",
          zip_code: "",
          country: "US"
        },
        // Add data sharing settings
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "private",
          gift_preferences: "public",
          email: "private"
        }
      }
    };

    console.log("[Nicole Giftee] Enhanced standardized data for Profile Setup:", JSON.stringify(standardizedData, null, 2));
    
    // Store with multiple keys for better reliability
    localStorage.setItem("nicoleCollectedData", JSON.stringify(standardizedData));
    localStorage.setItem("nicoleGifteeData", JSON.stringify(standardizedData));
    localStorage.setItem("nicoleDataReady", "true");
    localStorage.setItem("nicoleDataTimestamp", Date.now().toString());
    
    console.log("[Nicole Giftee] Data stored in localStorage with keys: nicoleCollectedData, nicoleGifteeData, nicoleDataReady, nicoleDataTimestamp");
    
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
            onNameChange={(name) => {
              console.log("[Nicole Giftee] Name changed:", name);
              setCollectedData(prev => ({ ...prev, name }));
            }}
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
