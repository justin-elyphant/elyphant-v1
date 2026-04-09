
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrivacySettings, FieldVisibility } from "@/hooks/usePrivacySettings";

interface PrivacyStepProps {
  profileData: any;
  updateProfileData: (key: string, value: any) => void;
}

/**
 * Onboarding privacy step.
 * Now reads/writes directly from the unified privacy_settings table.
 */
const PrivacyStep: React.FC<PrivacyStepProps> = () => {
  const { settings, updateSettings } = usePrivacySettings();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Your information will be shared with friends by default. You can block specific friends later if needed.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Birthday</Label>
          <Select
            value={settings.dob_visibility}
            onValueChange={(value) => updateSettings({ dob_visibility: value as FieldVisibility })}
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
            value={settings.interests_visibility}
            onValueChange={(value) => updateSettings({ interests_visibility: value as FieldVisibility })}
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

export default PrivacyStep;
