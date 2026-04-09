import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePrivacySettings, FieldVisibility } from "@/hooks/usePrivacySettings";
import PrivacySelector from "./PrivacySelector";

interface DataSharingSectionProps {
  embedded?: boolean;
}

/**
 * Section for managing data sharing settings in user profile.
 * Now reads/writes directly from the unified privacy_settings table.
 */
const DataSharingSection: React.FC<DataSharingSectionProps> = ({ embedded = false }) => {
  const { settings, updateSettings } = usePrivacySettings();

  const handleSharingChange = (field: keyof typeof fieldMap, value: FieldVisibility) => {
    updateSettings({ [fieldMap[field]]: value });
  };

  const fieldMap = {
    dob: 'dob_visibility' as const,
    interests: 'interests_visibility' as const,
  };

  const content = (
    <div className="space-y-4">
      <PrivacySelector
        value={settings.dob_visibility as any}
        onChange={(value) => handleSharingChange("dob", value as FieldVisibility)}
        label="Birthday Visibility"
        description="Who can see your date of birth (year is never shown)"
      />

      <Separator />

      <PrivacySelector
        value={settings.interests_visibility as any}
        onChange={(value) => handleSharingChange("interests", value as FieldVisibility)}
        label="Interests Visibility"
        description="Who can see your interests and preferences"
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>My Data</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Control who can see your personal information. Your preferences can be changed at any time.
        </p>
        {content}
      </CardContent>
    </Card>
  );
};

export default DataSharingSection;
