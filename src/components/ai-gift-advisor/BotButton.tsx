
import React from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface BotButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const BotButton: React.FC<BotButtonProps> = ({ 
  onClick, 
  className,
  variant = "outline",
  size = "sm"
}) => {
  const isMobile = useIsMobile();

  const handleClick = () => {
    console.log("BotButton clicked - triggering Nicole with auto-greeting");
    // Dispatch custom event for immediate Nicole activation with auto-greeting
    window.dispatchEvent(new CustomEvent('triggerNicole', {
      detail: {
        capability: 'conversation',
        source: 'bot-button',
        autoGreeting: true,
        greetingContext: {
          greeting: 'general-welcome',
          activeMode: 'gift-advisor'
        }
      }
    }));
    
    // Call the original onClick handler
    onClick();
  };

  return (
    <Button
      variant={variant}
      size={isMobile ? "icon" : size}
      onClick={handleClick}
      className={cn(
        "bg-elyphant-gradient relative transition-all duration-200 hover:scale-105 hover:opacity-90 touch-manipulation",
        "text-white border-0",
        "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        isMobile ? "h-8 w-8 p-2" : "px-3 py-2",
        className
      )}
      aria-label="Chat with Nicole - Your Gift Guru"
    >
      <Bot className={cn("h-4 w-4", isMobile ? "" : "mr-2")} />
      {!isMobile && <span className="font-medium text-sm">Ask Nicole</span>}
    </Button>
  );
};

export default BotButton;
