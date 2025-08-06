import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Sparkles, X, ChevronDown, Bug } from "lucide-react";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { UnifiedNicoleContext } from "@/services/ai/unified/types";
import { toast } from "sonner";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { useAuth } from "@/contexts/auth";

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
  const [showDebug, setShowDebug] = useState(false);
  const [welcomeAdded, setWelcomeAdded] = useState(false);
  const { user } = useAuth();

  const { chatWithNicole, loading, context, lastResponse, sessionId, getConversationContext } = useUnifiedNicoleAI({
    initialContext: {
      capability: 'gift_advisor',
      ...initialContext
    }
  });

  // Get conversation history from the service
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  
  // Update conversation history when new messages come in
  useEffect(() => {
    try {
      const serviceContext = getConversationContext();
      // Get conversation state from the service - this should include the full conversation history
      // For now, we'll track messages locally and sync with the service
      if (lastResponse) {
        // Add the assistant's response to local history if it's not already there
        setConversationHistory(prev => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg || lastMsg.content !== lastResponse.message) {
            return [...prev, { role: 'assistant', content: lastResponse.message }];
          }
          return prev;
        });
      }
    } catch (error) {
      console.log('Error syncing conversation history:', error);
    }
  }, [lastResponse, getConversationContext]);

  // Add welcome message to service conversation if needed
  useEffect(() => {
    if (isOpen && welcomeMessage && !welcomeAdded && conversationHistory.length === 0) {
      // Add welcome message directly to the service's conversation history
      const welcomeEntry = { role: 'assistant', content: welcomeMessage };
      // This will be handled by the service automatically when first message is sent
      setWelcomeAdded(true);
    }
  }, [isOpen, welcomeMessage, welcomeAdded, conversationHistory.length]);

  // Reset welcome flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setWelcomeAdded(false);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage("");

    // Add user message to local conversation history immediately
    setConversationHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await chatWithNicole(userMessage);
      
      if (response) {
        // Check if Nicole indicates auto-gift setup is complete
        if (response.actions && response.actions.includes('setup_auto_gifting')) {
          await handleAutoGiftSetup(response);
        }

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

  const handleAutoGiftSetup = async (response: any) => {
    if (!user?.id) {
      toast.error("Please log in to set up auto-gifting");
      return;
    }

    try {
      const ctx = response.context || context;
      
      // Extract auto-gifting information from context
      const recipientName = ctx.recipientName || ctx.recipient;
      const budget = ctx.budget || [25, 50];
      const relationship = ctx.relationship || 'friend';
      
      if (!recipientName) {
        toast.error("Recipient information missing for auto-gift setup");
        return;
      }

      // Create auto-gifting rule
      const ruleData = {
        user_id: user.id,
        recipient_id: null, // Will be set when connection is established
        pending_recipient_email: null, // Will be set if needed
        date_type: 'birthday', // Default to birthday
        is_active: true,
        budget_limit: Array.isArray(budget) ? budget[1] : budget,
        notification_preferences: {
          enabled: true,
          days_before: [7, 3, 1],
          email: true,
          push: false
        },
        gift_selection_criteria: {
          source: 'wishlist' as const,
          categories: [],
          exclude_items: []
        },
        relationship_context: {
          closeness_level: 5,
          relationship_type: relationship,
          recipient_name: recipientName
        }
      };

      const newRule = await unifiedGiftManagementService.createRule(ruleData);
      
      if (newRule) {
        toast.success(`Auto-gifting set up for ${recipientName}! I'll handle their gifts automatically.`);
        
        // Close dialog after success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error setting up auto-gifting:', error);
      toast.error("Failed to set up auto-gifting. Please try again.");
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
          {/* Show welcome message if it exists and no conversation history */}
          {welcomeMessage && conversationHistory.length === 0 && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  <Sparkles className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                <p className="text-sm whitespace-pre-wrap">{welcomeMessage}</p>
              </div>
            </div>
          )}
          
          {/* Display conversation history from service */}
          {conversationHistory.map((msg, index) => (
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

        {/* Debug Section */}
        {process.env.NODE_ENV === 'development' && (
          <Collapsible open={showDebug} onOpenChange={setShowDebug}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between border-t pt-2">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug Info
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDebug ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 p-3 bg-muted/50 rounded-lg text-xs">
              <div>
                <h4 className="font-semibold mb-1">Session ID:</h4>
                <p className="font-mono text-muted-foreground">{sessionId}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Current Context:</h4>
                <pre className="bg-background p-2 rounded border text-xs overflow-auto max-h-24">
                  {JSON.stringify(context, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Service Conversation ({conversationHistory.length} messages):</h4>
                <pre className="bg-background p-2 rounded border text-xs overflow-auto max-h-24">
                  {JSON.stringify(conversationHistory, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Service Conversation History:</h4>
                <pre className="bg-background p-2 rounded border text-xs overflow-auto max-h-24">
                  {JSON.stringify(getConversationContext?.() || 'Not available', null, 2)}
                </pre>
              </div>

              {lastResponse && (
                <div>
                  <h4 className="font-semibold mb-1">Last Response Metadata:</h4>
                  <pre className="bg-background p-2 rounded border text-xs overflow-auto max-h-24">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Clear conversation from the service instead
                  // This will be handled by the service's clearConversation method
                  console.log('Service conversation cleared');
                }}
                className="w-full"
              >
                Clear Service Conversation
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}

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