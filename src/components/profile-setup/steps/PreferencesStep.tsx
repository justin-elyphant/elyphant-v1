
import React from "react";
import GiftPreferencesStep from "./GiftPreferencesStep";
import { ProfileData } from "../hooks/types";

interface PreferencesStepProps {
  profileData: ProfileData;
  updateProfileData: (field: keyof ProfileData, value: any) => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({ profileData, updateProfileData }) => {
  return (
    <GiftPreferencesStep
      preferences={profileData.gift_preferences}
      onPreferencesChange={(preferences) => updateProfileData("gift_preferences", preferences)}
    />
  );
};

export default PreferencesStep;
