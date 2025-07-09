import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update suggestions based on input
  useEffect(() => {
    if (value.length >= 2) {
      const matches = fuzzySearch(value, suggestions, 0.3);
      
      // Prioritize exact matches and popular items
      const prioritizedMatches = matches.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const queryLower = value.toLowerCase();
        
        // Exact matches first
        if (aLower === queryLower && bLower !== queryLower) return -1;
        if (bLower === queryLower && aLower !== queryLower) return 1;
        
        // Starts with query next
        if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
        if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;
        
        return 0;
      });
      
      setFilteredSuggestions(prioritizedMatches);
      setIsOpen(prioritizedMatches.length > 0);
      setSelectedIndex(0);
      
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
    setSelectedIndex(0);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && isOpen) {
        handleSuggestionSelect(filteredSuggestions[selectedIndex]);
      }
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
      }
      return;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
      return;
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
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
            <div className="max-h-[200px] overflow-y-auto">
              {filteredSuggestions.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No suggestions found.</div>
              ) : (
                <div className="p-1">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        "px-2 py-1.5 text-sm cursor-pointer rounded-sm flex items-center",
                        index === selectedIndex 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent/50"
                      )}
                    >
                      <Check className={cn("mr-2 h-4 w-4", index === selectedIndex ? "opacity-100" : "opacity-0")} />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
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