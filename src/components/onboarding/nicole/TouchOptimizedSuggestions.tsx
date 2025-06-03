
import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface Suggestion {
  text: string;
  icon?: LucideIcon;
  action?: string;
  intent?: string;
}

interface TouchOptimizedSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  title?: string;
}

const TouchOptimizedSuggestions: React.FC<TouchOptimizedSuggestionsProps> = ({
  suggestions,
  onSelect,
  title = "Quick responses:"
}) => {
  return (
    <div className="p-4 bg-gray-50 border-t border-gray-100">
      {title && (
        <p className="text-sm text-gray-600 mb-3 font-medium">{title}</p>
      )}
      
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          
          return (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start h-auto p-4 text-left touch-manipulation"
              onClick={() => onSelect(suggestion)}
            >
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <IconComponent className="h-5 w-5 text-purple-600 flex-shrink-0" />
                )}
                <span className="text-sm">{suggestion.text}</span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TouchOptimizedSuggestions;
