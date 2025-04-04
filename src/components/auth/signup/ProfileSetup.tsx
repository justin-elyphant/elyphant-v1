
import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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
    newInterest: ""
  });

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (onProfileDataChange) {
      onProfileDataChange({
        ...profileData,
        [name]: value
      });
    }
  };

  const handleAddInterest = () => {
    if (profileData.newInterest.trim() === "") return;
    
    const updatedInterests = [...profileData.interests, profileData.newInterest.trim()];
    setProfileData(prev => ({
      ...prev,
      interests: updatedInterests,
      newInterest: ""
    }));
    
    if (onProfileDataChange) {
      onProfileDataChange({
        ...profileData,
        interests: updatedInterests,
        newInterest: ""
      });
    }
  };

  const handleRemoveInterest = (index: number) => {
    const updatedInterests = profileData.interests.filter((_, i) => i !== index);
    setProfileData(prev => ({
      ...prev,
      interests: updatedInterests
    }));
    
    if (onProfileDataChange) {
      onProfileDataChange({
        ...profileData,
        interests: updatedInterests
      });
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
        <Progress value={progress} className="h-2" />
      </CardHeader>

      {step === 1 && (
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative group cursor-pointer">
            <Avatar className="h-32 w-32">
              {profileImage ? (
                <AvatarImage src={profileImage} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <label htmlFor="profile-image" className="cursor-pointer p-4">
                <Camera className="h-8 w-8 text-white" />
                <span className="sr-only">Upload profile image</span>
              </label>
            </div>
            <input
              id="profile-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageUpload}
            />
          </div>
          
          <div className="text-center text-sm text-muted-foreground max-w-sm">
            Your profile picture helps other users recognize you and makes your profile more inviting.
          </div>
        </CardContent>
      )}

      {step === 2 && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself and what you're interested in..."
              rows={4}
              value={profileData.bio}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profileData.interests.map((interest: string, index: number) => (
                <div 
                  key={index} 
                  className="bg-muted px-3 py-1 rounded-full flex items-center gap-1"
                >
                  <span>{interest}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveInterest(index)}
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-3 w-3">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="newInterest"
                name="newInterest"
                placeholder="Add an interest (e.g., Photography, Hiking)"
                value={profileData.newInterest}
                onChange={handleInputChange}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddInterest}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>
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
