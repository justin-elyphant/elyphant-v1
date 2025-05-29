
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/profile";
import ProfileImageUpload from "@/components/settings/ProfileImageUpload";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Link } from "react-router-dom";
import { Settings, Edit, Camera } from "lucide-react";

interface SettingsTabContentProps {
  profile: Profile | null;
  onUpdateProfile?: (data: Partial<Profile>) => Promise<void>;
}

const SettingsTabContent: React.FC<SettingsTabContentProps> = ({ profile, onUpdateProfile }) => {
  const { updateProfile } = useProfile();
  
  if (!profile) {
    return <div>Loading settings...</div>;
  }

  const handleImageUpdate = async (imageUrl: string | null) => {
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({ profile_image: imageUrl });
      } else {
        await updateProfile({ profile_image: imageUrl });
      }
    } catch (error) {
      console.error("Failed to update profile image:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Update your profile picture to help others recognize you.
          </p>
          <ProfileImageUpload
            currentImage={profile.profile_image}
            name={profile.name || "User"}
            onImageUpdate={handleImageUpdate}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Update your name, bio, interests, and other profile information.
          </p>
          <Button asChild>
            <Link to="/settings">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage your privacy settings, notifications, and account preferences.
          </p>
          <Button variant="outline" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTabContent;
