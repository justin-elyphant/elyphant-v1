
import React from "react";
import DateOfBirthStep from "./DateOfBirthStep";
import { ProfileData } from "../hooks/types";

interface BirthdayStepProps {
  profileData: ProfileData;
  updateProfileData: (field: keyof ProfileData, value: any) => void;
}

const BirthdayStep: React.FC<BirthdayStepProps> = ({ profileData, updateProfileData }) => {
  return (
    <DateOfBirthStep
      value={profileData.dob}
      onChange={(dob) => updateProfileData("dob", dob)}
    />
  );
};

export default BirthdayStep;
