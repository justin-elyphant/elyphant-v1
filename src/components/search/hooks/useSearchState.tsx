
import { useState, useRef } from "react";
import { FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { ZincProduct } from "@/components/marketplace/zinc/types";

export const useSearchState = () => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [unifiedResults, setUnifiedResults] = useState<{
    friends: FriendSearchResult[];
    products: ZincProduct[];
    brands: string[];
  }>({ friends: [], products: [], brands: [] });
  // Note: showNicoleDropdown is now managed by NicoleStateContext
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [nicoleResponse, setNicoleResponse] = useState("");
  const [showSearchButton, setShowSearchButton] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const nicoleDropdownRef = useRef<HTMLDivElement>(null);

  return {
    query,
    setQuery,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    setSuggestions,
    unifiedResults,
    setUnifiedResults,
    // showNicoleDropdown managed by NicoleStateContext
    showMobileModal,
    setShowMobileModal,
    isListening,
    setIsListening,
    searchLoading,
    setSearchLoading,
    hasUserInteracted,
    setHasUserInteracted,
    nicoleResponse,
    setNicoleResponse,
    showSearchButton,
    setShowSearchButton,
    inputRef,
    suggestionRef,
    nicoleDropdownRef
  };
};
