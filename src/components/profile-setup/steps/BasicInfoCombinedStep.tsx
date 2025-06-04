
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ProfileImageUpload from "@/components/settings/ProfileImageUpload";

interface BasicInfoCombinedStepProps {
  name: string;
  email: string;
  bio: string;
  profile_image: string | null;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onBioChange: (bio: string) => void;
  onProfileImageChange: (image: string | null) => void;
}

const BasicInfoCombinedStep: React.FC<BasicInfoCombinedStepProps> = ({
  name,
  email,
  bio,
  profile_image,
  onNameChange,
  onEmailChange,
  onBioChange,
  onProfileImageChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Tell us about yourself</h3>
        <p className="text-sm text-muted-foreground">
          This information helps personalize your gifting experience
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Profile Image */}
        <div className="flex justify-center">
          <ProfileImageUpload
            currentImage={profile_image}
            name={name || "User"}
            onImageUpdate={onProfileImageChange}
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us a bit about yourself"
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            This will be visible on your profile page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoCombinedStep;
