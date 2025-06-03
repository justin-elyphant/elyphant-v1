
import React from "react";
import { Button } from "@/components/ui/button";
import { triggerHapticFeedback } from "@/utils/haptics";
import { LucideIcon } from "lucide-react";

interface Suggestion {
  text: string;
  intent?: string;
  icon?: LucideIcon;
  data?: any;
}

interface TouchOptimizedSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  title?: string;
}

const TouchOptimizedSuggestions: React.FC<TouchOptimizedSuggestionsProps> = ({
  suggestions,
  onSelect,
  title = "Suggestions:"
}) => {
  const handleSelect = (suggestion: Suggestion) => {
    triggerHapticFeedback('selection');
    onSelect(suggestion);
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-100">
      {title && (
        <p className="text-sm font-medium text-gray-600 mb-3">{title}</p>
      )}
      
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          
          return (
            <Button
              key={index}
              variant="outline"
              className="
                w-full h-auto p-4 text-left justify-start
                border-2 border-gray-200 hover:border-purple-300
                bg-white hover:bg-purple-50
                rounded-xl transition-all duration-200
                touch-manipulation
                min-h-[60px]
              "
              onClick={() => handleSelect(suggestion)}
            >
              <div className="flex items-center gap-3 w-full">
                {IconComponent && (
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-purple-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900 leading-relaxed">
                  {suggestion.text}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TouchOptimizedSuggestions;
