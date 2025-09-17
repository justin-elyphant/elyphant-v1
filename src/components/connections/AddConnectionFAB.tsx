import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface AddConnectionFABProps {
  onClick: () => void;
  className?: string;
}

export const AddConnectionFAB: React.FC<AddConnectionFABProps> = ({ 
  onClick, 
  className 
}) => {
  const handleClick = () => {
    triggerHapticFeedback('impact');
    onClick();
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className={cn(
        "fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 border-2 border-background",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        className
      )}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};