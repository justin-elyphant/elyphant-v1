
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
        <Popover>
          <PopoverTrigger asChild>
            <Badge variant="outline" className="bg-white hover:bg-purple-50 cursor-pointer">
              +{interests.length - 3} more
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex flex-wrap gap-2 max-w-xs">
              {interests.slice(3).map((interest, index) => (
                <Badge 
                  key={index + 3}
                  variant="outline" 
                  className="bg-white hover:bg-purple-50 cursor-pointer"
                  onClick={() => {
                    onInterestClick(interest);
                  }}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default UserInterests;
