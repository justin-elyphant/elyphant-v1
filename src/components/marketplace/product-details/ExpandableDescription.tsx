import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
}

const ExpandableDescription = ({ description, maxLength = 150 }: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description || description.length <= maxLength) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    );
  }

  const truncatedText = description.slice(0, maxLength) + "...";
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {isExpanded ? description : truncatedText}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-0 text-primary hover:text-primary/80 text-sm font-medium"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp className="ml-1 h-3 w-3" />
          </>
        ) : (
          <>
            Show more <ChevronDown className="ml-1 h-3 w-3" />
          </>
        )}
      </Button>
    </div>
  );
};

export default ExpandableDescription;