/**
 * EnhancedNicoleConversationEngine - Temporarily disabled during migration to SimpleNicole
 * This component will be updated to use the new simplified architecture
 */

import React from "react";

interface EnhancedNicoleConversationProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialQuery?: string;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  initialContext?: string;
  onIntentComplete?: (intent: "auto-gift" | "shop-solo" | "create-wishlist") => void;
  [key: string]: any;
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationProps> = () => {
  // Temporarily return null during migration
  // This component needs significant refactoring to work with SimpleNicole
  return null;
};

export default EnhancedNicoleConversationEngine;