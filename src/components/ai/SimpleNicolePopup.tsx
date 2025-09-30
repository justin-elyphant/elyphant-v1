import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, X } from "lucide-react";
import { useSimpleNicole } from "@/hooks/useSimpleNicole";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

interface SimpleNicolePopupProps {
  isOpen: boolean;
  onClose: () => void;
  welcomeMessage?: string;
}

const SimpleNicolePopup = ({ 
  isOpen, 
  onClose, 
  welcomeMessage 
}: SimpleNicolePopupProps) => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  
  const { 
    messages, 
    context, 
    isLoading, 
    sendMessage, 
    startDynamicGreeting,
    clearConversation 
  } = useSimpleNicole();

  // Send welcome message when opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (welcomeMessage) {
        // Send custom welcome message
        sendMessage(welcomeMessage);
      } else {
        // Start with dynamic greeting
        startDynamicGreeting();
      }
    }
  }, [isOpen, messages.length, welcomeMessage, sendMessage, startDynamicGreeting]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const currentMessage = message;
    setMessage("");
    
    try {
      await sendMessage(currentMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCTAClick = (button: any) => {
    console.log('CTA button clicked:', button);
    
    // Handle auto-gift setup
    if (button.action === 'setup_auto_gift') {
      toast.success(`Setting up auto-gifting for ${button.data.recipientName}!`);
      // This would trigger the auto-gift setup flow
      window.dispatchEvent(new CustomEvent('triggerAutoGiftSetup', {
        detail: button.data
      }));
    }
  };

  const handleClose = () => {
    clearConversation();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="Nicole AI" />
              <AvatarFallback>
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            Nicole AI Assistant
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="ml-auto h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm">{msg.content}</p>
                
                {/* CTA Buttons */}
                {msg.ctaButtons && msg.ctaButtons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.ctaButtons.map((button) => (
                      <Button
                        key={button.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCTAClick(button)}
                        className="w-full text-left justify-start"
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
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-muted-foreground ml-2">Nicole is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Nicole about gifts..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Context Display */}
          {Object.keys(context).length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Context: {context.recipient && `${context.recipient}`}
              {context.occasion && ` • ${context.occasion}`}
              {context.budget && ` • $${context.budget[0]}-$${context.budget[1]}`}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleNicolePopup;