/**
 * NicoleConversationEngine - Temporarily disabled during migration to SimpleNicole
 * This component will be updated to use the new simplified architecture
 */

import React from "react";

interface NicoleConversationEngineProps {
  isOpen?: boolean;
  onClose?: () => void;
  [key: string]: any;
}

export const NicoleConversationEngine: React.FC<NicoleConversationEngineProps> = () => {
  // Temporarily return null during migration
  // This component needs significant refactoring to work with SimpleNicole
  return null;
};

export default NicoleConversationEngine;