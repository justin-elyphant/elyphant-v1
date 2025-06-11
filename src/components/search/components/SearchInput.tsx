
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bot, Sparkles } from "lucide-react";
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
  inputRef
}) => {
  const placeholderText = isNicoleMode 
    ? "Ask Nicole anything about gifts..." 
    : "Search friends, products, or brands";

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full" autoComplete="off">
      <div className={`relative flex-1 flex items-center transition-all duration-300 ${
        isNicoleMode ? 'ring-2 ring-purple-300 ring-offset-2' : ''
      }`}>
        {/* AI Mode Toggle */}
        <div className="absolute left-3 flex items-center gap-2 z-10">
          <Search className={`h-4 w-4 transition-colors duration-200 ${
            isNicoleMode ? 'text-purple-500' : 'text-gray-400'
          }`} />
          <IOSSwitch
            size="sm"
            checked={isNicoleMode}
            onCheckedChange={handleModeToggle}
            className="touch-manipulation"
          />
          <Bot className={`h-4 w-4 transition-colors duration-200 ${
            isNicoleMode ? 'text-purple-500' : 'text-gray-400'
          }`} />
          {isNicoleMode && (
            <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholderText}
          className={`pl-32 pr-24 transition-all duration-300 ${
            mobile ? "text-base py-3 h-12" : ""
          } rounded-full border-gray-300 ${
            isNicoleMode 
              ? 'border-purple-300 focus:border-purple-500 bg-gradient-to-r from-purple-50/30 to-indigo-50/30' 
              : 'focus:border-blue-500'
          }`}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

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
