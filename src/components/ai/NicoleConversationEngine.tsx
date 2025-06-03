
import React from "react";
import EnhancedNicoleConversationEngine from "./enhanced/EnhancedNicoleConversationEngine";

interface NicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

const NicoleConversationEngine: React.FC<NicoleConversationEngineProps> = (props) => {
  // Use the enhanced version by default
  return <EnhancedNicoleConversationEngine {...props} />;
};

export default NicoleConversationEngine;
