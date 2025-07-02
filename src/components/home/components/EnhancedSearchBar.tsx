
import React from "react";
import UnifiedSearchBar from "@/components/search/UnifiedSearchBar";

interface EnhancedSearchBarProps {
  mobile?: boolean;
}

// Legacy component - now uses UnifiedSearchBar
const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({ mobile = false }) => {
  return <UnifiedSearchBar mobile={mobile} />;
};

export default EnhancedSearchBar;
