
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { MonthDayPicker } from "@/components/ui/month-day-picker";
import { ProfileData } from "../hooks/types";

interface BasicInfoStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ profileData, updateProfileData }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profileData.profile_image || null);

  // Log when this component renders to trace potential issues
  useEffect(() => {
    console.log("BasicInfoStep rendered with profileData:", profileData);
    console.log("Current name value:", profileData.name);
    console.log("Current birthday value:", profileData.birthday);
    console.log("Name is valid?", !!(profileData.name && profileData.name.trim().length > 0));
  }, [profileData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    console.log("Name input changed from:", profileData.name, "to:", newName);
    updateProfileData('name', newName);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateProfileData('bio', e.target.value);
  };

  const handleBirthdayChange = (birthday: { month: number; day: number } | null) => {
    console.log("Birthday changed to:", birthday);
    updateProfileData('birthday', birthday);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        updateProfileData('profile_image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">About You</h3>
        <p className="text-sm text-muted-foreground">
          Let's get to know you better to personalize your gifting experience
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="space-y-3">
          <Label>Profile Photo</Label>
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imagePreview || undefined} />
              <AvatarFallback className="text-lg">
                {profileData.name ? getInitials(profileData.name) : <Camera className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-image-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('profile-image-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                Optional - helps friends recognize you
              </p>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            value={profileData.name || ""}
            onChange={handleNameChange}
            autoFocus
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            This is how friends will find and recognize you
          </p>
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <Label>Birthday</Label>
          <MonthDayPicker
            value={profileData.birthday}
            onChange={handleBirthdayChange}
            placeholder="Select your birthday"
          />
          <p className="text-xs text-muted-foreground">
            We'll use this to remind friends about your special day
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">About Me</Label>
          <Textarea
            id="bio"
            placeholder="Tell us a bit about yourself, your interests, or what makes you unique..."
            rows={3}
            value={profileData.bio || ""}
            onChange={handleBioChange}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Optional - helps friends choose better gifts for you
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
