
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";

import ProfileImageSection from "./profile-setup/ProfileImageSection";
import InterestsSection from "./profile-setup/InterestsSection";
import BioSection from "./profile-setup/BioSection";
import ProfileSetupStepIndicator from "./profile-setup/ProfileSetupStepIndicator";

interface ProfileSetupProps {
  userName: string;
  profileImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onComplete: () => void;
  onSkip: () => void;
  onProfileDataChange?: (data: any) => void;
  initialProfileData?: any;
}

const ProfileSetup = ({ 
  userName, 
  profileImage, 
  onImageUpload, 
  onComplete, 
  onSkip,
  onProfileDataChange,
  initialProfileData = {}
}: ProfileSetupProps) => {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    bio: initialProfileData.bio || "",
    interests: initialProfileData.interests || [],
  });

  const totalSteps = 2;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...profileData, [name]: value };
    
    setProfileData(updatedData);
    if (onProfileDataChange) {
      onProfileDataChange(updatedData);
    }
  };

  const handleAddInterest = (interest: string) => {
    const updatedInterests = [...profileData.interests, interest];
    const updatedData = { ...profileData, interests: updatedInterests };
    
    setProfileData(updatedData);
    if (onProfileDataChange) {
      onProfileDataChange(updatedData);
    }
  };

  const handleRemoveInterest = (index: number) => {
    const updatedInterests = profileData.interests.filter((_, i) => i !== index);
    const updatedData = { ...profileData, interests: updatedInterests };
    
    setProfileData(updatedData);
    if (onProfileDataChange) {
      onProfileDataChange(updatedData);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
        <CardDescription>
          {step === 1 ? "Start with a picture to personalize your account" : "Tell us a bit about yourself"}
        </CardDescription>
        <ProfileSetupStepIndicator currentStep={step} totalSteps={totalSteps} />
      </CardHeader>

      {step === 1 && (
        <CardContent>
          <ProfileImageSection 
            userName={userName}
            profileImage={profileImage}
            onImageUpload={onImageUpload}
          />
        </CardContent>
      )}

      {step === 2 && (
        <CardContent className="space-y-4">
          <BioSection 
            bio={profileData.bio} 
            onChange={handleInputChange} 
          />
          
          <InterestsSection 
            interests={profileData.interests}
            onAddInterest={handleAddInterest}
            onRemoveInterest={handleRemoveInterest}
          />
        </CardContent>
      )}

      <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-6">
        {step === 1 ? (
          <Button 
            variant="ghost" 
            className="w-full sm:w-auto"
            onClick={onSkip}
          >
            Skip for now
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={prevStep}
          >
            Back
          </Button>
        )}

        <Button 
          onClick={step < totalSteps ? nextStep : onComplete}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
        >
          {step < totalSteps ? "Continue" : "Complete Setup"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileSetup;
