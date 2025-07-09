import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, AlertCircle, Lightbulb } from "lucide-react";
import { fuzzySearch, getSpellingSuggestion } from "@/utils/fuzzySearch";

interface SmartInputProps {
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
  suggestions = [],
  spellingCorrections = {},
  onKeyDown,
  className,
  showSpellingSuggestions = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);
  const [showSpellingAlert, setShowSpellingAlert] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update suggestions based on input
  useEffect(() => {
    if (value.length >= 2) {
      const matches = fuzzySearch(value, suggestions, 0.3);
      setFilteredSuggestions(matches);
      setIsOpen(matches.length > 0);
      
      // Check for spelling suggestions
      if (showSpellingSuggestions) {
        const correction = getSpellingSuggestion(value, spellingCorrections);
        if (correction && correction.toLowerCase() !== value.toLowerCase()) {
          setSpellingSuggestion(correction);
          setShowSpellingAlert(true);
        } else {
          setSpellingSuggestion(null);
          setShowSpellingAlert(false);
        }
      }
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
      setSpellingSuggestion(null);
      setShowSpellingAlert(false);
    }
  }, [value, suggestions, spellingCorrections, showSpellingSuggestions]);

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setShowSpellingAlert(false);
    inputRef.current?.focus();
  };

  const handleSpellingCorrection = () => {
    if (spellingSuggestion) {
      onChange(spellingSuggestion);
      setShowSpellingAlert(false);
      setSpellingSuggestion(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
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
        </PopoverTrigger>
        
        {isOpen && filteredSuggestions.length > 0 && (
          <PopoverContent className="w-full p-0 z-50 bg-popover border shadow-md" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No suggestions found.</CommandEmpty>
                <CommandGroup>
                  {filteredSuggestions.map((suggestion, index) => (
                    <CommandItem
                      key={index}
                      value={suggestion}
                      onSelect={() => handleSuggestionSelect(suggestion)}
                      className="cursor-pointer"
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      
      {/* Spelling suggestion alert */}
      {showSpellingAlert && spellingSuggestion && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Lightbulb className="h-4 w-4" />
              <span>Did you mean "{spellingSuggestion}"?</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSpellingCorrection}
                className="h-6 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Use suggestion
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSpellingAlert(false)}
                className="h-6 px-2 text-xs text-orange-600 hover:bg-orange-100"
              >
                Ignore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};