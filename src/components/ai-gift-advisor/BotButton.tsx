
import React from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

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
  size = "default"
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "relative transition-all duration-200 hover:scale-105 touch-manipulation",
        "bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0",
        "hover:from-purple-600 hover:to-indigo-700",
        "focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        className
      )}
      aria-label="Open AI Gift Advisor"
    >
      <Bot className="h-5 w-5 mr-2" />
      <span className="font-medium">AI Assistant</span>
    </Button>
  );
};

export default BotButton;
