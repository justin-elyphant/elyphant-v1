
import { useState } from "react";

export const useProfileData = (initialData = { bio: "", interests: [] as string[] }) => {
  const [profileData, setProfileData] = useState(initialData);

  const handleProfileDataChange = (data: any) => {
    setProfileData(data);
  };

  return {
    profileData,
    handleProfileDataChange
  };
};
