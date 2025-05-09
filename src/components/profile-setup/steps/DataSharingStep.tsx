
import React from "react";
import { Shield } from "lucide-react";
import { SharingLevel } from "@/types/supabase";
import { ProfileData } from "../hooks/types";
import { getSharingLevelLabel } from "@/utils/privacyUtils";
import PrivacySelector from "@/components/settings/PrivacySelector";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DataSharingStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const DataSharingStep: React.FC<DataSharingStepProps> = ({ profileData, updateProfileData }) => {
  const handlePrivacyChange = (field: keyof ProfileData["data_sharing_settings"], value: SharingLevel) => {
    updateProfileData("data_sharing_settings", {
      ...profileData.data_sharing_settings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">Privacy Settings</h2>
      </div>

      <p className="text-muted-foreground">
        Control who can see your personal information. Your preferences can be changed at any time in settings.
      </p>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          Your privacy matters to us. We default to the most secure options, but you can customize your preferences.
        </AlertDescription>
      </Alert>

      <div className="space-y-8 pt-4">
        <PrivacySelector
          value={profileData.data_sharing_settings.email}
          onChange={(value) => handlePrivacyChange("email", value)}
          label="Email Address Visibility"
          description="Who can see your email address"
        />
        
        <PrivacySelector
          value={profileData.data_sharing_settings.dob}
          onChange={(value) => handlePrivacyChange("dob", value)}
          label="Birthday Visibility"
          description="Who can see your date of birth"
        />
        
        <PrivacySelector
          value={profileData.data_sharing_settings.shipping_address}
          onChange={(value) => handlePrivacyChange("shipping_address", value)}
          label="Shipping Address Visibility"
          description="Who can see your shipping address"
        />
        
        <PrivacySelector
          value={profileData.data_sharing_settings.gift_preferences}
          onChange={(value) => handlePrivacyChange("gift_preferences", value)}
          label="Gift Preferences Visibility"
          description="Who can see your gift preferences and interests"
        />
      </div>
    </div>
  );
};

export default DataSharingStep;
