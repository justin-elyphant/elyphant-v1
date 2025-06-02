
import React from "react";

interface SearchSuggestionsProps {
  suggestions: string[];
  isVisible: boolean;
  onSuggestionClick: (suggestion: string) => void;
  mobile?: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  isVisible,
  onSuggestionClick,
  mobile = false
}) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <ul className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 text-sm">
      {suggestions.map((suggestion, idx) => (
        <li
          key={idx}
          className={`p-3 cursor-pointer hover:bg-purple-50 border-b border-gray-100 last:border-b-0 touch-manipulation ${
            mobile ? "min-h-[44px] flex items-center" : ""
          }`}
          onClick={() => onSuggestionClick(suggestion)}
        >
          {suggestion}
        </li>
      ))}
    </ul>
  );
};

export default SearchSuggestions;
