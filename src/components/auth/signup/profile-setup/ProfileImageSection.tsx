
import React from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileImageSectionProps {
  userName: string;
  profileImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileImageSection = ({ 
  userName, 
  profileImage, 
  onImageUpload 
}: ProfileImageSectionProps) => {
  return (
    <div className="flex flex-col items-center gap-6">
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
    </div>
  );
};

export default ProfileImageSection;
