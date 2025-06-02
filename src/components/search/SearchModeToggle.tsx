
import React from "react";
import { Search, Bot, Sparkles } from "lucide-react";
import { IOSSwitch } from "@/components/ui/ios-switch";

interface SearchModeToggleProps {
  isNicoleMode: boolean;
  onModeToggle: (checked: boolean) => void;
}

const SearchModeToggle: React.FC<SearchModeToggleProps> = ({
  isNicoleMode,
  onModeToggle
}) => {
  return (
    <div className="absolute left-3 flex items-center gap-2 z-10">
      <Search className={`h-4 w-4 transition-colors duration-200 ${
        isNicoleMode ? 'text-purple-500' : 'text-gray-400'
      }`} />
      <div className="relative">
        <IOSSwitch
          size="sm"
          checked={isNicoleMode}
          onCheckedChange={onModeToggle}
          className="touch-manipulation"
        />
        {/* Mode indicator icons inside the switch */}
        <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
          <Search className={`h-2.5 w-2.5 transition-opacity duration-200 ${
            !isNicoleMode ? 'opacity-100 text-white' : 'opacity-40 text-gray-500'
          }`} />
        </div>
      </div>
      <Bot className={`h-4 w-4 transition-colors duration-200 ${
        isNicoleMode ? 'text-purple-500' : 'text-gray-400'
      }`} />
      {isNicoleMode && (
        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
      )}
    </div>
  );
};

export default SearchModeToggle;
