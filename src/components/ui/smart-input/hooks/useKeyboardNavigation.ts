import { useCallback } from "react";

interface UseKeyboardNavigationProps {
  filteredSuggestions: string[];
  selectedIndex: number;
  isOpen: boolean;
  setSelectedIndex: (index: number) => void;
  setIsOpen: (open: boolean) => void;
  handleSuggestionSelect: (suggestion: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onChange: (value: string) => void;
}

export const useKeyboardNavigation = ({
  filteredSuggestions,
  selectedIndex,
  isOpen,
  setSelectedIndex,
  setIsOpen,
  handleSuggestionSelect,
  onKeyDown,
  onChange
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'suggestions:', filteredSuggestions.length);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && isOpen) {
        // If dropdown is open, select the suggestion (input already has the correct value)
        handleSuggestionSelect(filteredSuggestions[selectedIndex]);
      } else {
        // If dropdown is closed, let parent handle the Enter (to add to list)
        onKeyDown?.(e);
      }
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
        const newIndex = (selectedIndex + 1) % filteredSuggestions.length;
        setSelectedIndex(newIndex);
        // Update the input field to show the highlighted suggestion
        onChange(filteredSuggestions[newIndex]);
      }
      return;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setIsOpen(true);
        const newIndex = (selectedIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
        setSelectedIndex(newIndex);
        // Update the input field to show the highlighted suggestion
        onChange(filteredSuggestions[newIndex]);
      }
      return;
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }
    
    onKeyDown?.(e);
  }, [filteredSuggestions, selectedIndex, isOpen, setSelectedIndex, setIsOpen, handleSuggestionSelect, onKeyDown, onChange]);

  return { handleKeyDown };
};