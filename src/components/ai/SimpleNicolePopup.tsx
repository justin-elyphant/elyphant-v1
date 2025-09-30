import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, X, Bot } from "lucide-react";
import { useSimpleNicole } from "@/hooks/useSimpleNicole";
import { toast } from "sonner";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import { NicoleAutoGiftBridge } from "@/services/ai/NicoleAutoGiftBridge";
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
  const [autoGiftFlowOpen, setAutoGiftFlowOpen] = useState(false);
  const [autoGiftInitialData, setAutoGiftInitialData] = useState<any>(null);
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
    console.log('🎯 Nicole CTA clicked:', button);
    
    switch (button.action) {
      case 'setup_auto_gift':
        // Transform Nicole context to AutoGiftSetupFlow format
        const conversationHistory = messages.filter(m => m.content).map(m => ({
          role: m.role,
          content: m.content!
        }));
        
        const extractedInfo = NicoleAutoGiftBridge.extractRecipientInfo(conversationHistory);
        
        const bridgeContext = {
          recipientName: button.data?.recipientName || extractedInfo.recipientName,
          occasion: button.data?.occasion || context.occasion,
          budgetRange: button.data?.budgetRange || context.budget,
          relationshipType: extractedInfo.relationship || context.relationship,
          recipientId: context.recipient
        };
        
        const initialData = NicoleAutoGiftBridge.transformContext(bridgeContext);
        console.log('🔄 Transformed Nicole context for AutoGiftSetup:', initialData);
        
        setAutoGiftInitialData(initialData);
        setAutoGiftFlowOpen(true);
        
        toast.success(`Opening auto-gift setup for ${bridgeContext.recipientName || 'recipient'}!`);
        break;
        
      case 'search_products':
        // Handle product search CTAs
        if (button.data?.searchQuery) {
          window.dispatchEvent(new CustomEvent('navigateToSearch', {
            detail: { query: button.data.searchQuery, context }
          }));
        }
        break;
        
      case 'create_wishlist':
        // Handle wishlist creation
        toast.info("Opening wishlist creator...");
        // Navigate to wishlist creation
        break;
        
      default:
        console.log('Unknown CTA action:', button.action);
    }
  };

  const handleClose = () => {
    clearConversation();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
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
              <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-br-md' 
                    : 'bg-white/50 text-gray-800 border border-white/30 rounded-bl-md shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  
                  {/* CTA Buttons */}
                  {msg.ctaButtons && msg.ctaButtons.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.ctaButtons.map((button) => (
                        <Button
                          key={button.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleCTAClick(button)}
                          className="w-full text-left justify-start hover:bg-purple-50 border-purple-200"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {button.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          
            {isLoading && (
              <div className="flex items-end gap-3">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs">
                    <Bot className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white/50 rounded-lg p-3 border border-white/30 rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm text-gray-600 ml-2">Nicole is thinking...</span>
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
                className="flex-1 bg-white/50 border-white/30 backdrop-blur-sm"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Context Display */}
            {Object.keys(context).length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Context: {context.recipient && `${context.recipient}`}
                {context.occasion && ` • ${context.occasion}`}
                {context.budget && ` • $${context.budget[0]}-$${context.budget[1]}`}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto-Gift Setup Flow Integration */}
      <AutoGiftSetupFlow
        open={autoGiftFlowOpen}
        onOpenChange={setAutoGiftFlowOpen}
        initialData={autoGiftInitialData}
      />
    </>
  );
};

export default SimpleNicolePopup;