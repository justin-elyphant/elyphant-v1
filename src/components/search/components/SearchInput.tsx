
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bot, Sparkles, X } from "lucide-react";
import { IOSSwitch } from "@/components/ui/ios-switch";
import VoiceInputButton from "../VoiceInputButton";

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  isNicoleMode: boolean;
  handleModeToggle: (checked: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleVoiceInput: () => void;
  isListening: boolean;
  mobile: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onUserInteraction?: () => void;
  onClear?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  query,
  setQuery,
  isNicoleMode,
  handleModeToggle,
  handleSubmit,
  handleVoiceInput,
  isListening,
  mobile,
  inputRef,
  onUserInteraction,
  onClear
}) => {
  const placeholderText = isNicoleMode 
    ? "Ask Nicole anything about gifts..." 
    : "Search friends, products, or brands";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (onUserInteraction) {
      onUserInteraction();
    }
  };

  const handleInputFocus = () => {
    if (onUserInteraction) {
      onUserInteraction();
    }
  };

  const handleClearClick = () => {
    setQuery("");
    if (onClear) {
      onClear();
    }
    if (onUserInteraction) {
      onUserInteraction();
    }
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full" autoComplete="off">
      <div className={`relative flex-1 flex items-center transition-all duration-300 ${
        isNicoleMode ? 'ring-2 ring-purple-300 ring-offset-2' : ''
      }`}>
        {/* AI Mode Toggle - Always visible on mobile and desktop */}
        <div className="absolute left-2 flex items-center gap-1.5 z-10">
          <Search className={`transition-colors duration-200 ${
            mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
          } ${isNicoleMode ? 'text-purple-500' : 'text-gray-400'}`} />
          <IOSSwitch
            size="sm"
            checked={isNicoleMode}
            onCheckedChange={handleModeToggle}
            className={`touch-manipulation ${mobile ? 'scale-90' : ''}`}
          />
          <Bot className={`transition-colors duration-200 ${
            mobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
          } ${isNicoleMode ? 'text-purple-500' : 'text-gray-400'}`} />
          {isNicoleMode && (
            <Sparkles className={`text-purple-500 animate-pulse ${
              mobile ? 'h-2.5 w-2.5' : 'h-3 w-3'
            }`} />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholderText}
          className={`transition-all duration-300 rounded-full border-gray-300 ${
            mobile 
              ? "text-base py-3 h-12 pl-24 pr-12" 
              : "pl-32 pr-32"
          } ${
            isNicoleMode 
              ? 'border-purple-300 focus:border-purple-500 bg-gradient-to-r from-purple-50/30 to-indigo-50/30' 
              : 'focus:border-blue-500'
          }`}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />

        {/* Clear Button - Optimized for mobile */}
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearClick}
            className={`absolute h-6 w-6 p-0 rounded-full hover:bg-gray-100 transition-colors duration-200 ${
              mobile ? 'right-10' : 'right-16'
            }`}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </Button>
        )}

        {/* Voice Input Button */}
        <VoiceInputButton
          isListening={isListening}
          onVoiceInput={handleVoiceInput}
          mobile={mobile}
        />

        <Button
          type="submit"
          size="sm"
          className={`absolute right-2 rounded-full px-3 py-1 text-xs font-medium h-5 transition-all duration-300 touch-manipulation ${
            mobile ? "h-8 px-4" : ""
          } ${
            isNicoleMode 
              ? "bg-transparent hover:bg-purple-50 text-purple-500 hover:text-purple-600 border-0"
              : "bg-transparent hover:bg-blue-50 text-blue-500 hover:text-blue-600 border-0"
          }`}
        >
          {isNicoleMode ? "Ask" : "Search"}
          {isNicoleMode && (
            <Badge variant="secondary" className="ml-1 text-xs bg-white/20 h-4 px-1">AI</Badge>
          )}
        </Button>
      </div>
    </form>
  );
};

export default SearchInput;
