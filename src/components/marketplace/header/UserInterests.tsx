
import React from "react";
import { Badge } from "@/components/ui/badge";

interface UserInterestsProps {
  interests: string[];
  onInterestClick: (interest: string) => void;
}

export const UserInterests: React.FC<UserInterestsProps> = ({ 
  interests, 
  onInterestClick 
}) => {
  if (interests.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {interests.slice(0, 3).map((interest, index) => (
        <Badge 
          key={index}
          variant="outline" 
          className="bg-white hover:bg-purple-50 cursor-pointer"
          onClick={() => onInterestClick(interest)}
        >
          {interest}
        </Badge>
      ))}
      {interests.length > 3 && (
        <Badge variant="outline" className="bg-white">+{interests.length - 3} more</Badge>
      )}
    </div>
  );
};

export default UserInterests;
