import { useState, useEffect } from "react";
import { fuzzySearch, getSpellingSuggestion } from "@/utils/fuzzySearch";

interface UseSmartInputLogicProps {
  value: string;
  suggestions: string[];
  spellingCorrections: Record<string, string>;
  showSpellingSuggestions: boolean;
  onChange: (value: string) => void;
}

export const useSmartInputLogic = ({
  value,
  suggestions,
  spellingCorrections,
  showSpellingSuggestions,
  onChange
}: UseSmartInputLogicProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);
  const [showSpellingAlert, setShowSpellingAlert] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  return {
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
  };
};