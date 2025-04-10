
import { useState } from "react";

export const useInterestsManager = (initialInterests: string[] = []) => {
  const [interests, setInterests] = useState<string[]>(initialInterests);

  // Handle adding an interest
  const addInterest = (interest: string) => {
    if (!interest.trim() || interests.includes(interest.trim())) return;
    setInterests(prev => [...prev, interest.trim()]);
    return interests;
  };

  // Handle removing an interest
  const removeInterest = (index: number) => {
    setInterests(prev => prev.filter((_, i) => i !== index));
    return interests;
  };

  return {
    interests,
    setInterests,
    addInterest,
    removeInterest
  };
};
