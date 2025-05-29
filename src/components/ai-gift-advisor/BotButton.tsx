
import React from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotButtonProps {
  onClick: () => void;
  className?: string;
}

const BotButton = ({ onClick, className }: BotButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className={cn(
        "relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse",
        className
      )}
      aria-label="AI Gift Advisor"
    >
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline font-medium">AI Gift Helper</span>
        <Sparkles className="h-3 w-3 opacity-80" />
      </div>
      
      {/* Floating indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" />
    </Button>
  );
};

export default BotButton;
