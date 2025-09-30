/**
 * Migration wrapper to replace NicolePopup and NicoleConversationEngine
 * This provides backward compatibility while using the new simplified architecture
 */

import React from "react";
import SimpleNicolePopup from "./SimpleNicolePopup";

interface NicolePopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: any;
  className?: string;
}

interface NicoleConversationEngineProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: any;
}

// Backward compatible wrapper for NicolePopup
export const NicolePopupMigrated: React.FC<NicolePopupProps> = ({
  isOpen,
  onClose,
  initialContext,
  className
}) => {
  // Convert old initialContext to welcome message
  const welcomeMessage = initialContext?.capability === 'gift_advisor' 
    ? "I'm Nicole, your AI gift advisor. Let's find the perfect gift!"
    : undefined;

  return (
    <SimpleNicolePopup
      isOpen={isOpen}
      onClose={onClose}
      welcomeMessage={welcomeMessage}
    />
  );
};

// Backward compatible wrapper for NicoleConversationEngine
export const NicoleConversationEngineMigrated: React.FC<NicoleConversationEngineProps> = ({
  isOpen,
  onClose,
  initialContext
}) => {
  const welcomeMessage = "Hey! I'm Nicole, ready to help with your gift needs.";

  return (
    <SimpleNicolePopup
      isOpen={isOpen}
      onClose={onClose}
      welcomeMessage={welcomeMessage}
    />
  );
};

export default NicolePopupMigrated;