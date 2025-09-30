/**
 * AIEnhancedSearchBar - Legacy wrapper for backward compatibility
 * Now uses the new UnifiedSearchBar with NicoleDropdownProvider
 */

import React from "react";
import { NicoleDropdownProvider } from "./nicole/NicoleDropdownContext";
import { UnifiedSearchBar } from "./unified/UnifiedSearchBar";

interface AIEnhancedSearchBarProps {
  onNavigateToResults?: (searchQuery: string, nicoleContext?: any) => void;
  className?: string;
  mobile?: boolean;
}

const AIEnhancedSearchBar: React.FC<AIEnhancedSearchBarProps> = (props) => {
  return (
    <NicoleDropdownProvider onNavigateToResults={props.onNavigateToResults}>
      <UnifiedSearchBar {...props} />
    </NicoleDropdownProvider>
  );
};

export default AIEnhancedSearchBar;
