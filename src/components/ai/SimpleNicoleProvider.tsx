import React, { useState, useEffect } from "react";
import SimpleNicolePopup from "@/components/ai/SimpleNicolePopup";

export const SimpleNicoleProvider = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | undefined>();

  useEffect(() => {
    const handleTriggerSimpleNicole = (event: CustomEvent) => {
      console.log('Triggering Simple Nicole:', event.detail);
      setWelcomeMessage(event.detail?.welcomeMessage);
      setIsOpen(true);
    };

    window.addEventListener('triggerSimpleNicole', handleTriggerSimpleNicole as EventListener);

    return () => {
      window.removeEventListener('triggerSimpleNicole', handleTriggerSimpleNicole as EventListener);
    };
  }, []);

  return (
    <SimpleNicolePopup
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      welcomeMessage={welcomeMessage}
    />
  );
};