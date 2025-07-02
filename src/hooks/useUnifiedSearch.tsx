
import { useState, useRef } from "react";
import { useSearchMode } from "@/hooks/useSearchMode";
import { useAuth } from "@/contexts/auth";
import { useFriendSearch } from "@/hooks/useFriendSearch";
import { useSearchState } from "@/components/search/hooks/useSearchState";
import { useSearchLogic } from "@/components/search/hooks/useSearchLogic";
import { useSearchHandlers } from "@/components/search/hooks/useSearchHandlers";

export const useUnifiedSearch = () => {
  const { user } = useAuth();
  const { mode, setMode, isNicoleMode } = useSearchMode();
  const { sendFriendRequest } = useFriendSearch();
  
  const {
    query,
    setQuery,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    setSuggestions,
    unifiedResults,
    setUnifiedResults,
    showNicoleDropdown,
    setShowNicoleDropdown,
    showMobileModal,
    setShowMobileModal,
    isListening,
    setIsListening,
    searchLoading,
    setSearchLoading,
    hasUserInteracted,
    setHasUserInteracted,
    inputRef,
    suggestionRef,
    nicoleDropdownRef
  } = useSearchState();

  // Use search logic hook
  useSearchLogic({
    query,
    isNicoleMode,
    user,
    setSearchLoading,
    setUnifiedResults,
    setShowSuggestions,
    setSuggestions
  });

  // Use search handlers hook
  const searchHandlers = useSearchHandlers({
    isNicoleMode,
    setQuery,
    setShowSuggestions,
    setShowNicoleDropdown,
    setShowMobileModal,
    setIsListening,
    inputRef
  });

  const handleSendFriendRequest = async (friendId: string, friendName: string) => {
    await sendFriendRequest(friendId, friendName);
  };

  const handleModeToggle = (checked: boolean) => {
    const newMode = checked ? "nicole" : "search";
    setMode(newMode);
    setQuery("");
    setShowSuggestions(false);
    setHasUserInteracted(false);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return {
    // State
    query,
    setQuery,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    unifiedResults,
    showNicoleDropdown,
    setShowNicoleDropdown,
    showMobileModal,
    setShowMobileModal,
    isListening,
    searchLoading,
    hasUserInteracted,
    setHasUserInteracted,
    isNicoleMode,
    mode,
    
    // Handlers
    ...searchHandlers,
    handleSendFriendRequest,
    handleModeToggle,
    
    // Refs
    inputRef,
    suggestionRef,
    nicoleDropdownRef
  };
};
