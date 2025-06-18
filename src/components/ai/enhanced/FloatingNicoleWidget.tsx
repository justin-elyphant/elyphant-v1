
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import EnhancedNicoleConversationEngine from "./EnhancedNicoleConversationEngine";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingNicoleWidgetProps {
  onNavigateToResults: (searchQuery: string) => void;
  position?: string;
  defaultMinimized?: boolean;
}

const FloatingNicoleWidget: React.FC<FloatingNicoleWidgetProps> = ({
  onNavigateToResults,
  position = "bottom-right",
  defaultMinimized = true
}) => {
  const [isOpen, setIsOpen] = useState(!defaultMinimized);
  const isMobile = useIsMobile();

  const handleNavigateToResults = (searchQuery: string) => {
    console.log('FloatingNicoleWidget: Navigation callback triggered with:', searchQuery);
    onNavigateToResults(searchQuery);
    // Close the widget after navigation
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 ${
      isMobile 
        ? "inset-0 bg-black/50 flex items-end" 
        : "bottom-6 right-6 w-96 h-[500px]"
    }`}>
      {isMobile && (
        <div 
          className="absolute inset-0" 
          onClick={handleClose}
          aria-label="Close chat overlay"
        />
      )}
      
      <div className={`${
        isMobile 
          ? "w-full max-h-[80vh] bg-white rounded-t-xl" 
          : "w-full h-full"
      } relative`}>
        <EnhancedNicoleConversationEngine
          onClose={handleClose}
          onNavigateToResults={handleNavigateToResults}
        />
      </div>
    </div>
  );
};

export default FloatingNicoleWidget;
