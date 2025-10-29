
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileData } from "../hooks/types";

interface DataSharingStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const DataSharingStep: React.FC<DataSharingStepProps> = ({ 
  profileData, 
  updateProfileData 
}) => {
  const handlePrivacyChange = (field: string, value: string) => {
    updateProfileData('data_sharing_settings', {
      ...profileData.data_sharing_settings,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control who can see your information
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Email Address</Label>
          <Select
            value={profileData.data_sharing_settings?.email || "private"}
            onValueChange={(value) => handlePrivacyChange("email", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Birthday</Label>
          <Select
            value={profileData.data_sharing_settings?.dob || "friends"}
            onValueChange={(value) => handlePrivacyChange("dob", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Shipping Address</Label>
          <Select
            value={profileData.data_sharing_settings?.shipping_address || "private"}
            onValueChange={(value) => handlePrivacyChange("shipping_address", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Interests</Label>
          <Select
            value={profileData.data_sharing_settings?.interests || "friends"}
            onValueChange={(value) => handlePrivacyChange("interests", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DataSharingStep;
