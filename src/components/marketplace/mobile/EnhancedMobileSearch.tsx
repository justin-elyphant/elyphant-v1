
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, MicOff, X, Clock, TrendingUp, Tag, Package } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useEnhancedSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useUserSearchHistory } from '@/hooks/useUserSearchHistory';
import { triggerHapticFeedback, HapticPatterns } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface EnhancedMobileSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: (term: string) => void;
  className?: string;
}

const EnhancedMobileSearch: React.FC<EnhancedMobileSearchProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  className
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { addSearch } = useUserSearchHistory();
  const { suggestions, isLoading } = useEnhancedSearchSuggestions(inputValue);
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported
  } = useSpeechRecognition();

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
      onSearchChange(transcript);
    }
  }, [transcript, onSearchChange]);

  // Handle voice search
  const handleVoiceSearch = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onSearchChange(value);
    setShowSuggestions(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      triggerHapticFeedback(HapticPatterns.buttonTap);
      addSearch(inputValue.trim());
      onSearchSubmit(inputValue.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    triggerHapticFeedback(HapticPatterns.cardTap);
    setInputValue(suggestion);
    onSearchChange(suggestion);
    addSearch(suggestion);
    onSearchSubmit(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    setInputValue('');
    onSearchChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'brand':
        return <Tag className="w-4 h-4 text-purple-500" />;
      case 'category':
        return <Package className="w-4 h-4 text-blue-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search for gifts, brands, or categories..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className="w-full pl-10 pr-20 h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500 safe-area-inset"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-14 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 touch-target-44"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Voice Search Button */}
        {speechSupported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleVoiceSearch}
            className={cn(
              'absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 touch-target-44',
              isListening && 'bg-red-100 text-red-600 animate-pulse'
            )}
            disabled={!!speechError}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </form>

      {/* Voice Feedback */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg z-50">
          <p className="text-sm text-red-600 text-center">
            🎤 Listening... Speak now
          </p>
        </div>
      )}

      {/* Speech Error */}
      {speechError && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg z-50">
          <p className="text-sm text-red-600 text-center">
            Voice search error: {speechError}
          </p>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto safe-area-inset"
        >
          {isLoading && (
            <div className="p-4 text-center">
              <div className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading suggestions...</span>
            </div>
          )}
          
          {!isLoading && suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion.text)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 touch-target-44 tap-feedback border-b border-gray-100 last:border-b-0"
            >
              {getSuggestionIcon(suggestion.type)}
              <span className="flex-1 text-sm text-gray-900">{suggestion.text}</span>
              {suggestion.type === 'history' && (
                <span className="text-xs text-gray-400">Recent</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedMobileSearch;
