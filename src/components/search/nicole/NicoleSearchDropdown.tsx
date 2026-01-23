import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Maximize2, X, Send, Loader2 } from "lucide-react";
import { useNicoleDropdown } from "./NicoleDropdownContext";
import { Textarea } from "@/components/ui/textarea";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";

interface NicoleSearchDropdownProps {
  onExpand: () => void;
  searchQuery?: string;
}

export const NicoleSearchDropdown: React.FC<NicoleSearchDropdownProps> = ({
  onExpand,
  searchQuery
}) => {
  const {
    isDropdownOpen,
    closeDropdown,
    messages,
    context,
    isLoading,
    isAuthLoading,
    sendMessage,
    startDynamicGreeting,
    onNavigateToResults
  } = useNicoleDropdown();

  const [inputValue, setInputValue] = useState("");
  const [autoGiftModalOpen, setAutoGiftModalOpen] = useState(false);
  const [autoGiftInitialData, setAutoGiftInitialData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetingInitialized = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial greeting when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && messages.length === 0 && !greetingInitialized.current && !isAuthLoading) {
      greetingInitialized.current = true;
      
      if (searchQuery) {
        startDynamicGreeting({
          initialQuery: searchQuery,
          greeting: `I'd love to help you search for "${searchQuery}". Let me find some great options!`
        });
      } else {
        startDynamicGreeting();
      }
    }
  }, [isDropdownOpen, messages.length, searchQuery, isAuthLoading, startDynamicGreeting]);

  // Reset greeting flag when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      greetingInitialized.current = false;
    }
  }, [isDropdownOpen]);

  const handleCTAClick = (ctaButton: any) => {
    console.log('🎯 CTA Clicked:', ctaButton);
    
    if (ctaButton.action === 'setup_auto_gift') {
      // Pass data directly in the format AutoGiftSetupFlow expects
      const initialData = {
        recipientName: ctaButton.data?.recipientName || context.recipient,
        eventType: ctaButton.data?.occasion || context.occasion,
        budgetLimit: Array.isArray(ctaButton.data?.suggestedBudget) 
          ? ctaButton.data.suggestedBudget[1] 
          : (ctaButton.data?.budget || context.budget || 50),
        giftMessage: ctaButton.data?.message || `Happy ${ctaButton.data?.occasion || context.occasion || 'celebration'}!`
      };
      
      console.log('🎁 Opening AutoGiftSetupFlow with data:', initialData);
      setAutoGiftInitialData(initialData);
      setAutoGiftModalOpen(true);
    } else if (ctaButton.action === 'show_gift_recommendations') {
      // Navigate to search results with enhanced query
      const searchQuery = ctaButton.data?.searchQuery || 
        `gifts for ${ctaButton.data?.recipientName || 'them'} ${ctaButton.data?.occasion || ''}`.trim();
      
      const enhancedContext = {
        ...context,
        recipient: ctaButton.data?.recipientName,
        occasion: ctaButton.data?.occasion,
        budget: ctaButton.data?.budget,
        interests: ctaButton.data?.interests,
        relationship: ctaButton.data?.relationship
      };
      
      closeDropdown();
      onNavigateToResults?.(searchQuery, enhancedContext);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageToSend = inputValue;
    setInputValue("");
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    }
  };

  // Focus management
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isDropdownOpen]);

  if (!isDropdownOpen) return null;

  return (
    <>
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-[150] animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)' }} />
          <span className="text-sm font-medium text-foreground">Nicole AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-7 w-7 p-0"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeDropdown}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="h-[300px] p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* CTA Buttons */}
                {message.ctaButtons && message.ctaButtons.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    {message.ctaButtons.map((button, btnIndex) => (
                      <Button
                        key={btnIndex}
                        variant={button.action === 'setup_auto_gift' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleCTAClick(button)}
                        className="text-xs w-full"
                      >
                        {button.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nicole anything..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>

      {/* Auto-Gift Setup Modal */}
      <AutoGiftSetupFlow
        open={autoGiftModalOpen}
        onOpenChange={setAutoGiftModalOpen}
        initialData={autoGiftInitialData}
      />
    </>
  );
};
