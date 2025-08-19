import React from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EnhancedInterestsSectionProps {
  interests: string[];
  isOwnProfile: boolean;
}

const EnhancedInterestsSection = ({ interests, isOwnProfile }: EnhancedInterestsSectionProps) => {
  const navigate = useNavigate();
  
  if (!interests || interests.length === 0) return null;

  const handleFindProducts = (interest: string) => {
    console.log(`Searching marketplace for interest: ${interest}`);
    navigate(`/marketplace?search=${encodeURIComponent(interest)}`);
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">Interests</h3>
      <div className="grid gap-3">
        {interests.map((interest, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {interest}
              </div>
            </div>
            
            {!isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFindProducts(interest)}
                className="flex items-center gap-2 text-xs"
              >
                <Search className="h-3 w-3" />
                Find {interest} Products
              </Button>
            )}
          </div>
        ))}
        
        {!isOwnProfile && interests.length > 0 && (
          <div className="mt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleFindProducts(interests.join(' '))}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Browse All Interest Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInterestsSection;