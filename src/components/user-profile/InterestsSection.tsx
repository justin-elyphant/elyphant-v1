
import React from "react";

interface InterestsSectionProps {
  interests: string[];
}

const InterestsSection = ({ interests }: InterestsSectionProps) => {
  if (!interests || interests.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">Interests</h3>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, index) => (
          <div 
            key={index} 
            className="bg-muted px-3 py-1 rounded-full text-sm"
          >
            {interest}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterestsSection;
