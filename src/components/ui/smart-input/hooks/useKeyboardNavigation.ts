import { useCallback } from "react";

interface UseKeyboardNavigationProps {
  filteredSuggestions: string[];
  selectedIndex: number;
  isOpen: boolean;
  setSelectedIndex: (index: number) => void;
  setIsOpen: (open: boolean) => void;
  handleSuggestionSelect: (suggestion: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const useKeyboardNavigation = ({
  filteredSuggestions,
  selectedIndex,
  isOpen,
  setSelectedIndex,
  setIsOpen,
  handleSuggestionSelect,
  onKeyDown
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'suggestions:', filteredSuggestions.length);
    
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
        setSelectedIndex((selectedIndex + 1) % filteredSuggestions.length);
      }
      return;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
        setSelectedIndex((selectedIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      }
      return;
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }
    
    onKeyDown?.(e);
  }, [filteredSuggestions, selectedIndex, isOpen, setSelectedIndex, setIsOpen, handleSuggestionSelect, onKeyDown]);

  return { handleKeyDown };
};