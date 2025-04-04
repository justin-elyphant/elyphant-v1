
import React from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSetupProps {
  userName: string;
  profileImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onComplete: () => void;
  onSkip: () => void;
}

const ProfileSetup = ({ 
  userName, 
  profileImage, 
  onImageUpload, 
  onComplete, 
  onSkip 
}: ProfileSetupProps) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
        <CardDescription>
          Add a profile picture to personalize your account
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative group cursor-pointer">
          <Avatar className="h-24 w-24">
            {profileImage ? (
              <AvatarImage src={profileImage} alt="Profile" />
            ) : (
              <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <label htmlFor="profile-image" className="cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
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
        
        <div className="w-full space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Your profile picture helps other users recognize you and makes your profile more inviting.
          </div>
          
          <Button 
            onClick={onComplete}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Complete Setup
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onSkip}
          >
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSetup;
