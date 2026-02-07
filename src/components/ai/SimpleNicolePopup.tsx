import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, X, Bot, Minimize2 } from "lucide-react";
import { useSimpleNicole } from "@/hooks/useSimpleNicole";
import { toast } from "sonner";
import UnifiedGiftSchedulingModal from "@/components/gifting/unified/UnifiedGiftSchedulingModal";
import { NicoleAutoGiftBridge } from "@/services/ai/NicoleAutoGiftBridge";
import { useAuth } from "@/contexts/auth";

interface SimpleNicolePopupProps {
  isOpen: boolean;
  onClose: () => void;
  welcomeMessage?: string;
  onNavigateToResults?: (searchQuery: string, nicoleContext?: any) => void;
  canMinimize?: boolean;
  onMinimize?: () => void;
}

const SimpleNicolePopup = ({ 
  isOpen, 
  onClose, 
  welcomeMessage,
  onNavigateToResults,
  canMinimize = false,
  onMinimize
}: SimpleNicolePopupProps) => {
  const [message, setMessage] = useState("");
  const [autoGiftFlowOpen, setAutoGiftFlowOpen] = useState(false);
  const [autoGiftInitialData, setAutoGiftInitialData] = useState<any>(null);
  const greetingInitialized = useRef(false);
  const { user } = useAuth();
  
  const { 
    messages, 
    context, 
    isLoading, 
    isAuthLoading,
    sendMessage, 
    startDynamicGreeting,
    clearConversation 
  } = useSimpleNicole();

  // Send welcome message when opening - wait for auth to load first
  useEffect(() => {
    if (isOpen && messages.length === 0 && !greetingInitialized.current && !isAuthLoading) {
      greetingInitialized.current = true;
      
      console.log('🚀 Starting greeting with auth loaded, user:', user?.email);
      
      if (welcomeMessage) {
        // Use the hook's internal mechanism via startDynamicGreeting with custom message
        startDynamicGreeting({ customGreeting: welcomeMessage });
      } else {
        // Start with dynamic greeting
        startDynamicGreeting();
      }
    }
  }, [isOpen, messages.length, welcomeMessage, isAuthLoading, user]);

  // Reset greeting flag when popup closes
  useEffect(() => {
    if (!isOpen) {
      greetingInitialized.current = false;
    }
  }, [isOpen]);

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
        // Transform Nicole context to UnifiedGiftSchedulingModal format
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
        console.log('🔄 Transformed Nicole context for recurring gift setup:', initialData);
        
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
    greetingInitialized.current = false; // Reset greeting flag
    
    // Clean up URL parameters - remove mode=nicole
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'nicole') {
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
    
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                Nicole AI Assistant
              </DialogTitle>
              {canMinimize && onMinimize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMinimize}
                  className="mr-8"
                  title="Minimize to search bar"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
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

      {/* Recurring Gift Setup */}
      <UnifiedGiftSchedulingModal
        open={autoGiftFlowOpen}
        onOpenChange={setAutoGiftFlowOpen}
        standaloneMode={true}
        editingRule={autoGiftInitialData}
      />
    </>
  );
};

export default SimpleNicolePopup;