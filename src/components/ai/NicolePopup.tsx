import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, X } from "lucide-react";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { UnifiedNicoleContext } from "@/services/ai/unified/types";
import { toast } from "sonner";

interface NicolePopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: Partial<UnifiedNicoleContext>;
  welcomeMessage?: string;
}

const NicolePopup = ({ 
  isOpen, 
  onClose, 
  initialContext = {},
  welcomeMessage 
}: NicolePopupProps) => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: string; content: string }>>([]);

  const { chatWithNicole, loading, context } = useUnifiedNicoleAI({
    initialContext: {
      capability: 'gift_advisor',
      ...initialContext
    }
  });

  useEffect(() => {
    if (isOpen && welcomeMessage) {
      setConversation([
        { role: 'assistant', content: welcomeMessage }
      ]);
    }
  }, [isOpen, welcomeMessage]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage("");

    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await chatWithNicole(userMessage);
      
      if (response) {
        // Add Nicole's response to conversation
        setConversation(prev => [...prev, { role: 'assistant', content: response.message }]);

        // Check if we should auto-close after collecting preferences
        if (context.conversationPhase === 'giftee_preference_collection' && 
            userMessage.length > 20) { // Basic check for substantial input
          
          setTimeout(() => {
            toast.success("Thanks! Your preferences have been saved. Auto-gifting is now set up!");
            onClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error chatting with Nicole:', error);
      toast.error("Sorry, I'm having trouble right now. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[600px] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/nicole-avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                <Sparkles className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">Nicole AI</DialogTitle>
              <p className="text-sm text-muted-foreground">Gift Preference Assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] max-h-[400px]">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  <Sparkles className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Tell me about your preferences..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NicolePopup;