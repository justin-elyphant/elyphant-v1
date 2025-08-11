
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import { NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { useSmartCTALogic } from "@/components/ai/enhanced/hooks/useSmartCTALogic";
import GroupedSearchResultsComponent from "./GroupedSearchResults";
import type { GroupedSearchResults } from "@/services/ai/multiCategorySearchService";
import { ConversationEnhancementService } from "@/services/ai/conversationEnhancementService";
import SmartAutoGiftCTA from "@/components/ai/ctas/SmartAutoGiftCTA";
import { setupAutoGiftWithUnifiedSystems } from "@/services/ai/unified/autoGiftSetupHelper";
import { toast } from "sonner";

interface NicoleConversationEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMarketplace?: (searchQuery: string, nicoleContext?: any) => void;
  initialMessage?: string;
}

const NicoleConversationEngine: React.FC<NicoleConversationEngineProps> = ({
  isOpen,
  onClose,
  onNavigateToMarketplace,
  initialMessage
}) => {
  const { user } = useAuth();
  const { shouldShowCTAButton, extractContextFromMessage } = useSmartCTALogic();
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [groupedResults, setGroupedResults] = useState<GroupedSearchResults | null>(null);

  // Use unified Nicole AI service
  const {
    loading: isLoading,
    context,
    chatWithNicole,
    generateSearchQuery,
    isReadyToSearch,
    updateContext
  } = useUnifiedNicoleAI({
    sessionId: `nicole-conversation-${user?.id || 'anonymous'}`,
    initialContext: {
      currentUserId: user?.id
    }
  });

  const [showSearchButton, setShowSearchButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  // Smart auto-scroll logic - only scroll when new messages are added and user is near bottom
  useEffect(() => {
    const shouldAutoScroll = messages.length > lastMessageCount && !isUserScrolling;
    
    if (shouldAutoScroll && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        console.log('🔄 Auto-scrolling to bottom for new message');
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    }
    
    setLastMessageCount(messages.length);
  }, [messages, isLoading, groupedResults, lastMessageCount, isUserScrolling]);

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Maintain input focus
  useEffect(() => {
    if (isOpen && inputRef.current && !isLoading) {
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimeout);
    }
  }, [isOpen, isLoading, messages]);

  // Enhanced button display logic with comprehensive fallback
  useEffect(() => {
    console.log('🔍 Button display logic check:', {
      showSearchButton,
      context,
      lastMessage: messages[messages.length - 1]?.content
    });

    if (showSearchButton) {
      console.log('✅ Search button already shown via AI response');
      return;
    }

    // Fallback 1: Pattern detection in last AI message
    const lastAiMessage = messages.filter(m => m.role === 'assistant').pop();
    if (lastAiMessage) {
      const hasReadinessPhrase = detectReadinessPatterns(lastAiMessage.content);
      if (hasReadinessPhrase) {
        console.log('🎯 Fallback pattern detection activated search button');
        setShowSearchButton(true);
        return;
      }
    }

    // Fallback 2: Enhanced context-based logic  
    const hasRecipient = Boolean(context.recipient || context.relationship);
    const hasBudget = Boolean(context.budget);
    const hasInterests = Boolean(context.interests?.length > 0);
    const hasOccasion = Boolean(context.occasion);
    const hasBrands = Boolean(context.detectedBrands?.length > 0);
    
    // More lenient context requirements
    const hasMinimumContext = hasRecipient && (hasOccasion || hasInterests || hasBudget || hasBrands);
    
    // Special case: If we have budget and interests, always show button
    const hasComprehensiveContext = hasBudget && hasInterests;

    
    if (hasMinimumContext || hasComprehensiveContext) {
      console.log('🎯 Context-based fallback activated search button:', {
        hasRecipient,
        hasBudget,
        hasInterests,
        hasOccasion,
        hasBrands,
        hasMinimumContext,
        hasComprehensiveContext
      });
      setShowSearchButton(true);
    }
  }, [showSearchButton, context, messages]);

  // Enhanced pattern detection for readiness phrases
  const detectReadinessPatterns = (message: string): boolean => {
    const readinessPatterns = [
      /ready to see (your )?gifts/i,
      /let's find (some )?gifts/i,
      /search for gifts/i,
      /click.{0,10}search.{0,10}gifts/i,
      /search.{0,10}gifts.{0,10}below/i,
      /click.{0,10}below/i,
      /show you (some )?options/i,
      /browse (the )?marketplace/i,
      /time to shop/i,
      /perfect.*let's go/i,
      /ready to explore/i,
      /ready to search/i,
      /find the perfect gift/i,
      /great choices ahead/i,
      /here are.{0,30}ideas/i,
      /based on.{0,30}interests/i,
      /can show you.{0,30}gift/i
    ];
    
    return readinessPatterns.some(pattern => pattern.test(message));
  };

  const handleSearchInMarketplace = () => {
    console.log('🎯 Search button clicked - navigating to marketplace');
    console.log('🔍 onNavigateToMarketplace prop:', onNavigateToMarketplace);
    console.log('🔍 Current context (full):', JSON.stringify(context, null, 2));
    
    if (onNavigateToMarketplace) {
      try {
        const searchQuery = generateSearchQuery();
        console.log('🔍 Generated search query:', searchQuery);
        
        // Create enhanced context with all budget sources
        const enhancedContext = {
          ...context,
          // Ensure budget is available from any possible source
          budget: context.budget || 
                  (context.autoGiftIntelligence?.primaryRecommendation?.budgetRange) ||
                  undefined
        };
        
        console.log('🔍 Enhanced context with budget:', {
          originalBudget: context.budget,
          autoGiftBudget: context.autoGiftIntelligence?.primaryRecommendation?.budgetRange,
          finalBudget: enhancedContext.budget,
          interests: enhancedContext.interests,
          detectedBrands: enhancedContext.detectedBrands
        });
        
        console.log('🔍 CRITICAL: Passing enhanced context to navigation with budget array:', enhancedContext.budget);
        onNavigateToMarketplace(searchQuery, enhancedContext);
        onClose();
      } catch (error) {
        console.error('❌ Error navigating to marketplace:', error);
      }
    } else {
      console.error('❌ onNavigateToMarketplace prop not provided');
    }
  };

  // Smart Auto-Gift CTA logic
  const [isSettingUpAutoGift, setIsSettingUpAutoGift] = useState(false);
  const canOfferAutoGift = Boolean(
    context?.recipient && context?.occasion
  );

  const handleOfferAutoGift = async () => {
    if (!user?.id) {
      toast.error("Please log in to set up auto-gifting");
      return;
    }
    try {
      setIsSettingUpAutoGift(true);
      // If we already have a budget range, go straight to creating the rule
      const budget = Array.isArray(context?.budget) && context.budget.length === 2
        ? { min: Number(context.budget[0]), max: Number(context.budget[1]) }
        : undefined;

      if (budget) {
        await setupAutoGiftWithUnifiedSystems({
          userId: user.id,
          recipientName: String(context.recipient),
          occasion: String(context.occasion),
          budget,
          relationship: (context as any).relationship || 'friend'
        });
        toast.success("Auto-gifting set up successfully");
        const res = await chatWithNicole(
          `Please confirm we've set up auto-gifting for ${String(context.recipient)}'s ${String(context.occasion)} with a $${budget.min}-$${budget.max} budget.`
        );
        if (res?.message) {
          setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
        }
        if (res?.metadata?.contextUpdates) {
          updateContext(res.metadata.contextUpdates);
        }
        if (res?.showSearchButton) {
          setShowSearchButton(true);
        }
      } else {
        // Otherwise, transition the conversation into auto-gifting flow to capture budget
        const res = await chatWithNicole(
          `Let's set up auto-gifting for ${String(context.recipient)}'s ${String(context.occasion)}.`
        );
        if (res?.message) {
          setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
        }
        if (res?.metadata?.contextUpdates) {
          updateContext(res.metadata.contextUpdates);
        }
        if (res?.showSearchButton) {
          setShowSearchButton(true);
        }
      }
    } catch (e) {
      console.error('Auto-gift setup error', e);
      toast.error("Couldn't set up auto-gifting right now");
    } finally {
      setIsSettingUpAutoGift(false);
    }
  };
  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || currentMessage.trim();
    
    if (!messageToSend || isLoading) return;

    console.log('📤 Sending message:', messageToSend);

    const userMessage: NicoleMessage = {
      role: 'user',
      content: messageToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");

    try {
      console.log('🤖 Calling unified Nicole AI with context:', context);
      const response = await chatWithNicole(messageToSend);
      console.log('✅ Received response from unified Nicole:', response);
      
      if (response) {
        console.log('🔍 Response showSearchButton:', response.showSearchButton);
        
        const assistantMessage: NicoleMessage = {
          role: 'assistant',
          content: response.message
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Enhanced search button logic with debugging
        const shouldShow = Boolean(response.showSearchButton);
        console.log('🎯 Setting showSearchButton to:', shouldShow);
        setShowSearchButton(shouldShow);
        
        // Handle metadata updates
        if (response.metadata?.contextUpdates) {
          updateContext(response.metadata.contextUpdates);
        }
      }

    } catch (error) {
      console.error('💥 Error in Nicole conversation:', error);
      const errorMessage: NicoleMessage = {
        role: 'assistant',
        content: "I'm having trouble right now. Could you try rephrasing your question?"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Loading state is managed by the hook
    }
  };

  const handleFollowUpRequest = async (followUpMessage: string) => {
    console.log('🔄 Handling follow-up request:', followUpMessage);
    await handleSendMessage(followUpMessage);
  };

  const handleProductSelect = (product: any) => {
    console.log('Product selected:', product);
    // Handle product selection logic
  };

  const handleCategoryExpand = (categoryName: string) => {
    if (onNavigateToMarketplace) {
      // Update context with category interest and generate search
      const updatedContext = { ...context, interests: [categoryName] };
      updateContext({ interests: [categoryName] });
      const searchQuery = generateSearchQuery();
      console.log('🔍 Category expand - context with budget:', {
        budget: updatedContext.budget,
        autoGiftBudget: updatedContext.autoGiftIntelligence?.primaryRecommendation?.budgetRange,
        interests: updatedContext.interests
      });
      onNavigateToMarketplace(searchQuery, updatedContext);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Nicole</h3>
            <p className="text-xs text-gray-600">Your AI Gift Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* Messages - Constrained height with proper scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          height: showSearchButton 
            ? 'calc(100% - 200px)' // Header + search button + input
            : 'calc(100% - 140px)', // Header + input
          maxHeight: showSearchButton 
            ? 'calc(100% - 200px)'
            : 'calc(100% - 140px)'
        }}
      >
        <div className="p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Grouped Results Display */}
          {groupedResults && (
            <div className="mt-4">
              <GroupedSearchResultsComponent
                groupedResults={groupedResults}
                onProductSelect={handleProductSelect}
                onCategoryExpand={handleCategoryExpand}
                onFollowUpRequest={handleFollowUpRequest}
              />
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-600">Nicole is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Search Button with improved click handler */}
      {showSearchButton && (
        <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
          <Button
            onClick={handleSearchInMarketplace}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Ready to See Your Gifts!
          </Button>
        </div>
      )}

      {/* Smart Auto-Gift Offer */}
      {canOfferAutoGift && (
        <div className="p-4 border-t bg-white flex-shrink-0">
          <SmartAutoGiftCTA
            recipientName={String(context.recipient)}
            occasion={String(context.occasion)}
            loading={isSettingUpAutoGift}
            onConfirm={handleOfferAutoGift}
          />
        </div>
      )}

      {/* Input - Fixed at bottom */}
      <div className="p-4 border-t flex-shrink-0 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={currentMessage}
             onChange={(e) => setCurrentMessage(e.target.value)}
             onKeyDown={handleKeyDown}
            placeholder="Tell me about the gift you're looking for..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!currentMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicoleConversationEngine;
