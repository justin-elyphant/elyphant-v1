
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getSharingLevelLabel } from "@/utils/privacyUtils";
import { ProfileData } from "../hooks/types";

interface DataSharingStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const DataSharingStep: React.FC<DataSharingStepProps> = ({ profileData, updateProfileData }) => {
  const handleSharingChange = (field: string, value: "public" | "friends" | "private") => {
    const updatedSettings = {
      ...profileData.data_sharing_settings,
      [field]: value
    };
    
    updateProfileData("data_sharing_settings", updatedSettings);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Privacy Settings</h2>
        <p className="text-muted-foreground">
          Control who can see your profile information.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-privacy">Email Address</Label>
          <Select
            value={profileData.data_sharing_settings?.email || "private"}
            onValueChange={(value: "public" | "friends" | "private") => handleSharingChange("email", value)}
          >
            <SelectTrigger id="email-privacy" className="w-full">
              <SelectValue placeholder="Select who can see your email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{getSharingLevelLabel("private")}</SelectItem>
              <SelectItem value="friends">{getSharingLevelLabel("friends")}</SelectItem>
              <SelectItem value="public">{getSharingLevelLabel("public")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            We recommend keeping your email private.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dob-privacy">Date of Birth</Label>
          <Select
            value={profileData.data_sharing_settings?.dob || "friends"}
            onValueChange={(value: "public" | "friends" | "private") => handleSharingChange("dob", value)}
          >
            <SelectTrigger id="dob-privacy" className="w-full">
              <SelectValue placeholder="Select who can see your birthday" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{getSharingLevelLabel("private")}</SelectItem>
              <SelectItem value="friends">{getSharingLevelLabel("friends")}</SelectItem>
              <SelectItem value="public">{getSharingLevelLabel("public")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address-privacy">Shipping Address</Label>
          <Select
            value={profileData.data_sharing_settings?.shipping_address || "private"}
            onValueChange={(value: "public" | "friends" | "private") => handleSharingChange("shipping_address", value)}
          >
            <SelectTrigger id="address-privacy" className="w-full">
              <SelectValue placeholder="Select who can see your address" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{getSharingLevelLabel("private")}</SelectItem>
              <SelectItem value="friends">{getSharingLevelLabel("friends")}</SelectItem>
              <SelectItem value="public">{getSharingLevelLabel("public")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            This allows friends to send you gifts directly.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="preferences-privacy">Gift Preferences</Label>
          <Select
            value={profileData.data_sharing_settings?.gift_preferences || "friends"}
            onValueChange={(value: "public" | "friends" | "private") => handleSharingChange("gift_preferences", value)}
          >
            <SelectTrigger id="preferences-privacy" className="w-full">
              <SelectValue placeholder="Select who can see your preferences" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{getSharingLevelLabel("private")}</SelectItem>
              <SelectItem value="friends">{getSharingLevelLabel("friends")}</SelectItem>
              <SelectItem value="public">{getSharingLevelLabel("public")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DataSharingStep;
