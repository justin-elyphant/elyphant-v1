
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NicoleChatBubble from "./NicoleChatBubble";
import { format } from "date-fns";

interface NicoleGiftorFlowProps {
  conversationHistory: any[];
  initialData: any;
  onComplete: (data: any) => void;
  onAddMessage: (message: any) => void;
  onBack: () => void;
}

const NicoleGiftorFlow: React.FC<NicoleGiftorFlowProps> = ({
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
    budget_preference: ""
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
      content: "Perfect! I've gathered everything I need to help you become an amazing gift giver. Your preferences will help me suggest great gifts and connect you with friends and family who'll appreciate your thoughtful choices. Let's get you connected with others!"
    });

    // Enhanced data structure for Profile Setup with proper formatting
    const standardizedData = {
      name: collectedData.name,
      birthday: collectedData.birthday, // Format: MM-DD
      interests: collectedData.interests,
      userType: 'giftor',
      budget_preference: collectedData.budget_preference,
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

    console.log("[Nicole Giftor] Collecting enhanced data for Profile Setup:", standardizedData);
    
    // Store in localStorage with clear naming
    localStorage.setItem("nicoleCollectedData", JSON.stringify(standardizedData));
    
    // Also store a flag to indicate Nicole completed
    localStorage.setItem("nicoleDataReady", "true");
    
    setTimeout(() => {
      onComplete({ 
        giftorSetup: true,
        userData: standardizedData
      });
    }, 1500);
  };

  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return {
      value: String(i + 1).padStart(2, '0'),
      label: format(date, 'MMMM')
    };
  });

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1)
  }));

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <NicoleChatBubble
              message={{
                role: 'assistant',
                content: "Great choice! As a gift giver, you'll love how easy Elyphant makes finding the perfect presents. Let me get to know you better so I can help you give amazing gifts!"
              }}
            />
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label htmlFor="name">What's your name?</Label>
              <Input
                id="name"
                value={collectedData.name}
                onChange={(e) => setCollectedData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="mt-2"
              />
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <NicoleChatBubble
              message={{
                role: 'assistant',
                content: `Nice to meet you, ${collectedData.name}! When's your birthday? This helps me understand seasonal preferences and gift timing. I just need the month and day - no year required!`
              }}
            />
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label>Your Birthday</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Select value={selectedMonth} onValueChange={(value) => {
                    setSelectedMonth(value);
                    handleBirthdayChange(value, selectedDay);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="day">Day</Label>
                  <Select value={selectedDay} onValueChange={(value) => {
                    setSelectedDay(value);
                    handleBirthdayChange(selectedMonth, value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <NicoleChatBubble
              message={{
                role: 'assistant',
                content: "What are some of your interests? This helps me understand what kinds of gifts you might appreciate and recommend to others."
              }}
            />
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label>Your Interests</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {collectedData.interests.map((interest, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    {interest}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an interest"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInterestAdd((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-500">Press Enter to add each interest</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        {renderStep()}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          {step < 2 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={
                (step === 0 && !collectedData.name) ||
                (step === 1 && !collectedData.birthday)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Set up my gifting profile
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicoleGiftorFlow;
