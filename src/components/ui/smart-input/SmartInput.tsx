import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useSmartInputLogic } from "./hooks/useSmartInputLogic";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { SuggestionDropdown } from "./components/SuggestionDropdown";
import { SpellingAlert } from "./components/SpellingAlert";

// Stable default references to prevent infinite re-renders
const EMPTY_SUGGESTIONS: string[] = [];
const EMPTY_CORRECTIONS: Record<string, string> = {};

export interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  spellingCorrections?: Record<string, string>;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  showSpellingSuggestions?: boolean;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  placeholder,
  suggestions = EMPTY_SUGGESTIONS,
  spellingCorrections = EMPTY_CORRECTIONS,
  onKeyDown,
  className,
  showSpellingSuggestions = true
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    setIsOpen,
    filteredSuggestions,
    spellingSuggestion,
    showSpellingAlert,
    setShowSpellingAlert,
    selectedIndex,
    setSelectedIndex,
    handleSuggestionSelect,
    handleSpellingCorrection,
    handleInputChange
  } = useSmartInputLogic({
    value,
    suggestions,
    spellingCorrections,
    showSpellingSuggestions,
    onChange
  });

  const { handleKeyDown } = useKeyboardNavigation({
    filteredSuggestions,
    selectedIndex,
    isOpen,
    setSelectedIndex,
    setIsOpen,
    handleSuggestionSelect,
    onKeyDown,
    onChange
  });

  const handleSuggestionClick = (suggestion: string) => {
    handleSuggestionSelect(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            className,
            showSpellingAlert && "border-orange-300 focus:border-orange-500"
          )}
        />
        {showSpellingAlert && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" />
        )}
      </div>
      
      <SuggestionDropdown
        isOpen={isOpen}
        filteredSuggestions={filteredSuggestions}
        selectedIndex={selectedIndex}
        onSuggestionSelect={handleSuggestionClick}
      />
      
      <SpellingAlert
        showSpellingAlert={showSpellingAlert}
        spellingSuggestion={spellingSuggestion}
        onUseCorrection={handleSpellingCorrection}
        onIgnore={() => setShowSpellingAlert(false)}
      />
    </div>
  );
};