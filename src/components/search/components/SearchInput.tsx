
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, Mic, MicOff } from "lucide-react";
import VoiceInputButton from "../VoiceInputButton";

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  isNicoleMode: boolean;
  handleModeToggle: (checked: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleVoiceInput: () => void;
  isListening: boolean;
  mobile?: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onFocus?: () => void;
  onInput?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  query,
  setQuery,
  isNicoleMode,
  handleModeToggle,
  handleSubmit,
  handleVoiceInput,
  isListening,
  mobile = false,
  inputRef,
  onFocus,
  onInput
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (onInput) {
      onInput();
    }
  };

  const handleInputFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
      <div className="relative flex-1 flex items-center">
        {/* Nicole Mode Toggle - Desktop */}
        {!mobile && (
          <div className="absolute left-3 flex items-center gap-2 z-10">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${isNicoleMode ? 'text-purple-600' : 'text-gray-500'}`}>
                AI
              </span>
              <Switch
                checked={isNicoleMode}
                onCheckedChange={handleModeToggle}
                className="scale-75"
              />
            </div>
          </div>
        )}

        <Input
          ref={inputRef}
          type="search"
          placeholder={
            isNicoleMode 
              ? "Ask Nicole to find the perfect gift..." 
              : "Search for products, brands, or friends"
          }
          className={`${
            mobile 
              ? "pl-4 pr-24 text-base py-3 h-12 rounded-lg" 
              : `${isNicoleMode ? 'pl-16' : 'pl-10'} pr-24 h-10 rounded-lg`
          } border-gray-300 focus:border-${isNicoleMode ? 'purple' : 'blue'}-500 focus:ring-${isNicoleMode ? 'purple' : 'blue'}-500`}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />

        {/* Search Icon - for non-mobile without Nicole mode */}
        {!mobile && !isNicoleMode && (
          <div className="absolute left-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* Mobile Nicole Mode Toggle */}
        {mobile && (
          <div className="absolute right-16 flex items-center gap-1">
            <span className={`text-xs font-medium ${isNicoleMode ? 'text-purple-600' : 'text-gray-500'}`}>
              AI
            </span>
            <Switch
              checked={isNicoleMode}
              onCheckedChange={handleModeToggle}
              className="scale-75"
            />
          </div>
        )}

        {/* Voice Input Button */}
        <div className="absolute right-12 flex items-center">
          <VoiceInputButton
            onVoiceInput={handleVoiceInput}
            isListening={isListening}
            className="h-6 w-6"
          />
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          className={`absolute right-2 bg-${isNicoleMode ? 'purple' : 'blue'}-600 hover:bg-${isNicoleMode ? 'purple' : 'blue'}-700 text-white rounded-md px-3 py-1 text-sm font-medium ${
            mobile ? 'h-8' : 'h-7'
          }`}
        >
          {isNicoleMode ? 'Ask' : 'Search'}
        </Button>
      </div>
    </form>
  );
};

export default SearchInput;
