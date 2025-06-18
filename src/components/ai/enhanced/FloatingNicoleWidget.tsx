
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import EnhancedNicoleConversationEngine from "./EnhancedNicoleConversationEngine";

interface FloatingNicoleWidgetProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  defaultMinimized?: boolean;
  onNavigateToResults?: (searchQuery: string) => void;
}

const FloatingNicoleWidget: React.FC<FloatingNicoleWidgetProps> = ({
  className,
  position = "bottom-right",
  defaultMinimized = true,
  onNavigateToResults
}) => {
  const [isOpen, setIsOpen] = useState(!defaultMinimized);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const getPositionClasses = () => {
    if (dragPosition.x !== 0 || dragPosition.y !== 0) {
      return "";
    }
    
    switch (position) {
      case "bottom-right":
        return "bottom-6 right-6";
      case "bottom-left":
        return "bottom-6 left-6";
      case "top-right":
        return "top-6 right-6";
      case "top-left":
        return "top-6 left-6";
      default:
        return "bottom-6 right-6";
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleNavigateToResults = (searchQuery: string) => {
    if (onNavigateToResults) {
      onNavigateToResults(searchQuery);
    } else {
      // Fallback navigation
      const searchParams = new URLSearchParams();
      searchParams.set("search", searchQuery);
      window.location.href = `/marketplace?${searchParams.toString()}`;
    }
  };

  const widgetStyle = dragPosition.x !== 0 || dragPosition.y !== 0 
    ? {
        transform: `translate(${dragPosition.x}px, ${dragPosition.y}px)`,
        left: position.includes('right') ? 'auto' : '1.5rem',
        right: position.includes('right') ? '1.5rem' : 'auto',
        bottom: position.includes('bottom') ? '1.5rem' : 'auto',
        top: position.includes('top') ? '1.5rem' : 'auto',
      }
    : {};

  if (!isOpen) {
    return (
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 ease-in-out",
          getPositionClasses(),
          className
        )}
        style={widgetStyle}
      >
        <Button
          onClick={handleToggle}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-50 transition-all duration-300 ease-in-out",
        getPositionClasses(),
        className
      )}
      style={widgetStyle}
    >
      <Card className="w-96 h-96 shadow-xl border-0 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Nicole AI</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 p-0"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <CardContent className="p-0 h-full">
            <div className="h-full">
              <EnhancedNicoleConversationEngine
                onClose={handleClose}
                onNavigateToResults={handleNavigateToResults}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FloatingNicoleWidget;
