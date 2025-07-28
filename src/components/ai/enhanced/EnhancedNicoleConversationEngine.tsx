
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { NicoleMessage, NicoleContext, ConversationPhase } from "@/services/ai/nicoleAiService";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SearchButton from "./SearchButton";
import { useNavigate } from "react-router-dom";
import { generateEnhancedSearchQuery } from "@/services/ai/enhancedSearchQueryGenerator";
import QuickResponseButtons from "@/components/ai/conversation/QuickResponseButtons";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedGiftRecommendations } from "@/hooks/useEnhancedGiftRecommendations";
import EnhancedGiftRecommendations from "@/components/ai/recommendations/EnhancedGiftRecommendations";

interface ConversationMessage {
  type: "nicole" | "user";
  content: string;
  timestamp: Date;
}

interface EnhancedNicoleContext extends NicoleContext {
  conversationPhase?: ConversationPhase;
  detectedBrands?: string[];
  ageGroup?: string;
}

interface EnhancedNicoleConversationProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  initialContext?: string; // Context for post-auth-welcome and other flows
  onIntentComplete?: (intent: "auto-gift" | "shop-solo" | "create-wishlist") => void; // Callback for intent completion
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onMinimize,
  isMinimized = false,
  onMaximize,
  initialContext,
  onIntentComplete
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<NicoleMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [quickResponseOptions, setQuickResponseOptions] = useState<string[]>([]);
  const [showEnhancedRecommendations, setShowEnhancedRecommendations] = useState(false);
  
  // Use unified Nicole AI service
  const {
    loading: isGenerating,
    context,
    chatWithNicole,
    generateSearchQuery,
    isReadyToSearch,
    updateContext
  } = useUnifiedNicoleAI({
    sessionId: `enhanced-nicole-${user?.id || 'anonymous'}`,
    initialContext: {
      currentUserId: user?.id,
      conversationPhase: initialContext || 'standard',
      userFirstName: userProfile?.first_name
    }
  });
  
  // Enhanced recommendations hook
  const { generateRecommendations, loading: recommendationsLoading } = useEnhancedGiftRecommendations();
  
  const [showCTAButton, setShowCTAButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Fetch user profile for personalization
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, name')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    };
    fetchUserProfile();
  }, [user?.id]);

  // Remove this useEffect since it causes circular dependency
  // We'll handle initial messages in startConversation instead

  const addMessage = useCallback((message: ConversationMessage) => {
    setConversation(prev => [...prev, message]);
  }, []);

  // Simplified context extraction from user messages
  const extractContextFromMessage = useCallback((message: string, currentContext: EnhancedNicoleContext): EnhancedNicoleContext => {
    const lowerMessage = message.toLowerCase();
    let updatedContext = { ...currentContext };

    // Basic relationship detection
    const relationshipPatterns = [
      { pattern: /\bmy (?:wife|husband|spouse|partner)\b/i, recipient: 'spouse', relationship: 'spouse' },
      { pattern: /\bmy (?:mom|mother|dad|father)\b/i, recipient: 'parent', relationship: 'parent' },
      { pattern: /\bmy (?:son|daughter|child|kid)\b/i, recipient: 'child', relationship: 'child' },
      { pattern: /\bmy (?:friend|buddy|pal)\b/i, recipient: 'friend', relationship: 'friend' },
      { pattern: /\bmy (?:brother|sister|sibling)\b/i, recipient: 'sibling', relationship: 'sibling' }
    ];

    for (const { pattern, recipient, relationship } of relationshipPatterns) {
      if (pattern.test(message)) {
        updatedContext.recipient = recipient;
        updatedContext.relationship = relationship;
        break;
      }
    }

    // Basic occasion detection
    if (lowerMessage.includes('birthday')) updatedContext.occasion = 'birthday';
    if (lowerMessage.includes('christmas')) updatedContext.occasion = 'christmas';
    if (lowerMessage.includes('anniversary')) updatedContext.occasion = 'anniversary';

    // Basic interest detection
    const interests = ['yoga', 'cooking', 'fitness', 'reading', 'music', 'art', 'sports', 'gaming', 'travel'];
    const foundInterests = interests.filter(interest => lowerMessage.includes(interest));
    if (foundInterests.length > 0) {
      updatedContext.interests = [...new Set([...(updatedContext.interests || []), ...foundInterests])];
    }

    return updatedContext;
  }, []);

  const startConversation = useCallback(() => {
    // Handle post-auth welcome flow
    if (initialContext === 'post-auth-welcome' && userProfile?.first_name) {
      const welcomeMessage: ConversationMessage = {
        type: "nicole",
        content: `Hey ${userProfile.first_name}! Welcome to Elyphant! 🎉 I'm Nicole and I'm totally obsessed with finding the perfect gifts. I can help you find something amazing in like 60 seconds. What's up?`,
        timestamp: new Date()
      };
      addMessage(welcomeMessage);
      
      // Set quick response options for post-auth welcome
      setQuickResponseOptions([
        "Pick something amazing for me!",
        "I'll browse and shop myself", 
        "Help me make a wishlist"
      ]);
    } else {
      // Standard greeting
      const greetingMessage: ConversationMessage = {
        type: "nicole",
        content: "Hey there! I'm Nicole and I'm obsessed with finding perfect gifts! 🎁 What's the occasion? Who are we shopping for?",
        timestamp: new Date()
      };
      addMessage(greetingMessage);
    }
  }, [addMessage, initialContext, userProfile?.first_name]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const message = messageText || currentMessage.trim();
    if (!message) return;

    // Add user message
    const userMessage: ConversationMessage = {
      type: "user",
      content: message,
      timestamp: new Date()
    };
    addMessage(userMessage);

    // Update conversation history for AI
    const userAiMessage: NicoleMessage = {
      role: "user",
      content: message
    };
    setConversationHistory(prev => [...prev, userAiMessage]);

    setCurrentMessage("");

    try {
      // Extract context from user message (as backup)
      const extractedContext = extractContextFromMessage(message, context as any);
      if (extractedContext) {
        updateContext(extractedContext);
      }

      console.log('🔄 Enhanced Nicole: Sending message with context', {
        message,
        context: extractedContext,
        conversationHistory: conversationHistory.length
      });

      // Get AI response
      const aiResponse = await chatWithNicole(message);
      
      console.log('✅ Enhanced Nicole: Received AI response', aiResponse);
      console.log('🎯 CTA Button Debug - showSearchButton from API:', aiResponse.showSearchButton);

      // Add Nicole's response
      const nicoleMessage: ConversationMessage = {
        type: "nicole",
        content: aiResponse.message,
        timestamp: new Date()
      };
      addMessage(nicoleMessage);

      // Update conversation history
      const nicoleAiMessage: NicoleMessage = {
        role: "assistant",
        content: aiResponse.message
      };
      setConversationHistory(prev => [...prev, nicoleAiMessage]);

      // Update context if needed
      if (aiResponse.metadata?.contextUpdates) {
        updateContext(aiResponse.metadata.contextUpdates);
      }

      // Use ONLY the AI's decision for showing the CTA button
      const shouldShowButton = aiResponse.showSearchButton === true;
      console.log('🎯 CTA Button Debug - Setting showCTAButton to:', shouldShowButton);
      setShowCTAButton(shouldShowButton);

    } catch (error) {
      console.error('💥 Enhanced Nicole: Error in conversation', error);
      
      // Add fallback message
      const fallbackMessage: ConversationMessage = {
        type: "nicole",
        content: "Ugh, tech hiccup! 🙄 But I'm still super excited to help you find something amazing! Tell me who you're shopping for?",
        timestamp: new Date()
      };
      addMessage(fallbackMessage);
    } finally {
      // Loading state is managed by the hook
    }
  }, [currentMessage, addMessage, conversationHistory, context, extractContextFromMessage, updateContext, chatWithNicole]);

  // Enhanced quick response handling for Phase 2
  const handleQuickResponse = useCallback(async (option: string) => {
    // Clear quick response options after selection
    setQuickResponseOptions([]);
    
    // Add user's selection to conversation
    addMessage({ type: 'user', content: option, timestamp: new Date() });
    
    // Update context with selected intent and enhanced gift collection setup
    let selectedIntent: "auto-gift" | "shop-solo" | "create-wishlist";
    
    switch (option) {
      case "Pick something amazing for me!":
        selectedIntent = "auto-gift";
        updateContext({ 
          selectedIntent,
          conversationPhase: "gift_collection",
          capability: "gift_advisor",
          giftCollectionPhase: "recipient"
        });
        
        // Enhanced auto-gift flow with recommendations
        addMessage({ 
          type: 'nicole', 
          content: `Ooh, I love this! 🎉 I'm about to become your personal gift wizard!

Here's what we'll do:
• I'll ask you a few quick questions about who this is for
• I'll use AI to find some amazing options that'll make them smile
• If you want, I can even text them to discover what they're secretly hoping for
• Then I'll recommend the perfect gift based on everything I learn

First things first - who's this gift for? Tell me their name and how you know them!`,
          timestamp: new Date()
        });
        
        // Auto-generate recommendations after a brief delay
        setTimeout(async () => {
          try {
            // Use current context for recommendations
            const currentContext = context as any;
            await generateRecommendations({
              recipient: currentContext.recipient,
              relationship: currentContext.relationship,
              occasion: currentContext.occasion,
              interests: currentContext.interests,
              budget: currentContext.budget,
              conversationHistory: conversationHistory.slice(-5) // Last 5 messages for context
            });
            setShowEnhancedRecommendations(true);
            
            addMessage({ 
              type: 'nicole', 
              content: `Sweet! I've already started brainstorming some amazing options based on what you've told me! Check them out below, or keep chatting with me to make them even more perfect! 🎁`,
              timestamp: new Date()
            });
          } catch (error) {
            console.error('Failed to generate initial recommendations:', error);
          }
        }, 2000);
        
        // For auto-gift, notify parent of intent completion for consistency
        onIntentComplete?.(selectedIntent);
        break;
        
      case "I'll browse and shop myself":
        selectedIntent = "shop-solo";
        updateContext({ 
          selectedIntent,
          conversationPhase: "marketplace_assistant",
          capability: "marketplace_assistant"
        });
        
        // Enhanced marketplace experience with guidance
        addMessage({ 
          type: 'nicole', 
          content: `Love that! Sometimes the best gifts come from that perfect "I saw this and thought of you" moment! 

I'm sending you to our marketplace where you can explore to your heart's content. And hey, if you need any help or want recommendations while you're browsing, just give me a shout! I'll be here! 😊`,
          timestamp: new Date()
        });
        
        // Notify parent component of intent completion
        onIntentComplete?.(selectedIntent);
        
        setTimeout(() => {
          navigate("/marketplace");
          onClose();
        }, 2000);
        break;
        
      case "Help me make a wishlist":
        selectedIntent = "create-wishlist";
        updateContext({ 
          selectedIntent,
          conversationPhase: "wishlist_creation",
          capability: "wishlist_analysis"
        });
        
        // Enhanced wishlist creation flow
        addMessage({ 
          type: 'nicole', 
          content: `Ooh, smart move! A wishlist is like giving people a cheat sheet for making you happy! 

Let me take you to your profile where you can start building your wishlist. You can add stuff from our marketplace, or I can totally help you brainstorm things you'd love based on your vibe!`,
          timestamp: new Date()
        });
        
        // Notify parent component of intent completion
        onIntentComplete?.(selectedIntent);
        
        setTimeout(() => {
          navigate("/profile/settings");
          onClose();
        }, 2000);
        break;
    }
  }, [addMessage, updateContext, navigate, onClose, onIntentComplete, generateRecommendations, context, conversationHistory]);

  // Handle initial query effect
  useEffect(() => {
    if (initialQuery && conversation.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, conversation.length, handleSendMessage]);

  const handleSearchClick = useCallback(async () => {
    setIsSearching(true);
    
    try {
      console.log('🔍 Enhanced Nicole: Generating search query from context', context);
      
      // Generate search query using unified service
      const searchQuery = generateSearchQuery();
      
      console.log('🎯 Enhanced Nicole: Generated search query:', searchQuery);
      
      // Navigate to marketplace with search query
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      
      // Close the conversation
      onClose();
      
    } catch (error) {
      console.error('💥 Enhanced Nicole: Error generating search', error);
    } finally {
      setIsSearching(false);
    }
  }, [context, generateSearchQuery, navigate, onClose]);

  useEffect(() => {
    if (isOpen && conversation.length === 0 && !initialQuery) {
      startConversation();
    }
  }, [isOpen, conversation.length, initialQuery, startConversation, userProfile]);

  // Debug effect to monitor CTA button state
  useEffect(() => {
    console.log('🎯 CTA Button State Changed:', showCTAButton);
  }, [showCTAButton]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-96 bg-white shadow-2xl transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[500px]"
      }`}>
        <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Nicole - Your Gift Guru</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            {isMinimized && onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[360px] p-4">
                <div className="space-y-4">
                   {conversation.map((msg, index) => (
                     <div
                       key={index}
                       className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                     >
                       <div
                         className={`max-w-[80%] p-3 rounded-lg ${
                           msg.type === "user"
                             ? "bg-purple-600 text-white"
                             : "bg-gray-100 text-gray-900"
                         }`}
                       >
                         <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                         <p className="text-xs opacity-70 mt-1">
                           {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                       </div>
                     </div>
                   ))}
                   
                   {/* Quick Response Buttons for post-auth welcome */}
                   {quickResponseOptions.length > 0 && (
                     <QuickResponseButtons
                       options={quickResponseOptions}
                       onSelect={handleQuickResponse}
                     />
                    )}
                    
                    {/* Enhanced Gift Recommendations */}
                    {showEnhancedRecommendations && (
                      <div className="mt-4">
                        <EnhancedGiftRecommendations 
                          onRecommendationSelect={(rec) => {
                            addMessage({
                              type: 'user',
                              content: `I'm interested in: ${rec.title}`,
                              timestamp: new Date()
                            });
                            addMessage({
                              type: 'nicole',
                              content: `Great choice! "${rec.title}" is an excellent match. Would you like me to help you purchase this gift or continue exploring other options?`,
                              timestamp: new Date()
                            });
                          }}
                          onPurchaseIntent={(rec) => {
                            addMessage({
                              type: 'nicole',
                              content: `Perfect! I'll help you proceed with purchasing "${rec.title}" for $${rec.price}. Let me guide you through the next steps...`,
                              timestamp: new Date()
                            });
                            // Navigate to purchase flow
                            navigate(`/marketplace/product/${rec.productId}`);
                            onClose();
                          }}
                        />
                      </div>
                    )}
                   
                   {showCTAButton && (
                     <div className="flex justify-center py-4">
                       <SearchButton 
                         onSearch={handleSearchClick}
                         isLoading={isSearching}
                       />
                     </div>
                   )}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Nicole is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>
            </CardContent>

            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Tell me about your gift recipient..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isGenerating || !currentMessage.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default EnhancedNicoleConversationEngine;
