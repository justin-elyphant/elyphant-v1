
import React from "react";
import DataSharingStep from "./DataSharingStep";
import { ProfileData } from "../hooks/types";

interface PrivacyStepProps {
  profileData: ProfileData;
  updateProfileData: (field: keyof ProfileData, value: any) => void;
}

const PrivacyStep: React.FC<PrivacyStepProps> = ({ profileData, updateProfileData }) => {
  return (
    <DataSharingStep
      profileData={profileData}
      updateProfileData={updateProfileData}
    />
  );
};

export default PrivacyStep;
