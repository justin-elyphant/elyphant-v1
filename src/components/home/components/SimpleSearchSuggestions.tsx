
import React from "react";
import { Search, TrendingUp, Tag } from "lucide-react";

interface SimpleSearchSuggestionsProps {
  query: string;
  suggestions: Array<{
    text: string;
    type: 'completion' | 'popular' | 'category' | 'brand';
  }>;
  isVisible: boolean;
  onSuggestionClick: (suggestion: string) => void;
  mobile?: boolean;
}

const SimpleSearchSuggestions: React.FC<SimpleSearchSuggestionsProps> = ({
  query,
  suggestions,
  isVisible,
  onSuggestionClick,
  mobile = false
}) => {
  if (!isVisible || suggestions.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'popular':
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
      case 'category':
      case 'brand':
        return <Tag className="h-4 w-4 text-gray-400" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-semibold text-purple-600">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <ul className="absolute top-full left-0 right-0 z-50 bg-white shadow-lg border rounded-md mt-1 text-sm max-h-80 overflow-y-auto">
      {suggestions.map((suggestion, idx) => (
        <li
          key={idx}
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
          onClick={() => onSuggestionClick(suggestion.text)}
        >
          {getIcon(suggestion.type)}
          <span className="flex-1 text-gray-900">
            {highlightMatch(suggestion.text, query)}
          </span>
          {suggestion.type === 'popular' && (
            <span className="text-xs text-gray-500">Popular</span>
          )}
        </li>
      ))}
    </ul>
  );
};

export default SimpleSearchSuggestions;
