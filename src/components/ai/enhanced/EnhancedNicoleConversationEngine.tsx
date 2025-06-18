
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { chatWithNicole, generateSearchQuery, NicoleMessage, NicoleContext } from "@/services/ai/nicoleAiService";
import { cn } from "@/lib/utils";
import SearchButton from "./SearchButton";

interface EnhancedNicoleConversationEngineProps {
  initialQuery?: string;
  onClose: () => void;
  onNavigateToResults: (searchQuery: string) => void;
}

interface EnhancedNicoleContext extends NicoleContext {
  fromNicole?: boolean;
  searchQuery?: string;
  conversationSummary?: string;
  conversationHistory?: NicoleMessage[];
  enhancedZincApiPreserved?: boolean;
  marketplaceTransition?: boolean;
  lastNicoleMessage?: string;
  timestamp?: string;
  debugInfo?: any;
  searchCriteria?: {
    recipient?: string;
    relationship?: string;
    occasion?: string;
    exactAge?: number;
    interests?: string[];
    budget?: [number, number];
    detectedBrands?: string[];
  };
}

const EnhancedNicoleConversationEngine: React.FC<EnhancedNicoleConversationEngineProps> = ({
  initialQuery,
  onClose,
  onNavigateToResults
}) => {
  const [messages, setMessages] = useState<NicoleMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [aiContext, setAiContext] = useState<EnhancedNicoleContext>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(false);

  // Smart fallback logic to determine if CTA button should show
  const shouldShowCTAButton = useCallback((context: EnhancedNicoleContext, lastMessage?: string): boolean => {
    console.log('🧠 Smart CTA Logic Check:', {
      context,
      lastMessage: lastMessage?.substring(0, 100) + '...',
      aiFlag: showSearchButton
    });

    // Primary: Trust AI's decision if it says to show button
    if (showSearchButton) {
      console.log('✅ AI Flag: Showing CTA button');
      return true;
    }

    // Fallback 1: Check if Nicole gave a summary/confirmation message
    if (lastMessage) {
      const summaryIndicators = [
        'perfect! so',
        'great! so',
        'excellent! so',
        'to summarize',
        'so, to recap',
        'i\'m ready to find',
        'let me find',
        'ready to search',
        'let\'s find some',
        'here\'s what i have',
        'i have everything i need'
      ];
      
      const lowerMessage = lastMessage.toLowerCase();
      const hasSummaryIndicator = summaryIndicators.some(indicator => 
        lowerMessage.includes(indicator)
      );
      
      if (hasSummaryIndicator) {
        console.log('✅ Summary Indicator: Showing CTA button');
        return true;
      }
    }

    // Fallback 2: Smart context validation - has essential information
    const hasRecipient = Boolean(context.recipient || context.relationship);
    const hasOccasionOrAge = Boolean(context.occasion || context.exactAge);
    const hasInterestsOrBrands = Boolean(
      (context.interests && context.interests.length > 0) || 
      (context.detectedBrands && context.detectedBrands.length > 0)
    );
    const hasBudget = Boolean(context.budget && Array.isArray(context.budget) && context.budget.length === 2);

    // Essential info threshold: Need recipient + occasion + (interests OR budget)
    const hasEssentialInfo = hasRecipient && hasOccasionOrAge && (hasInterestsOrBrands || hasBudget);
    
    console.log('🔍 Context Validation:', {
      hasRecipient,
      hasOccasionOrAge,
      hasInterestsOrBrands,
      hasBudget,
      hasEssentialInfo
    });

    if (hasEssentialInfo) {
      console.log('✅ Essential Info Complete: Showing CTA button');
      return true;
    }

    // Fallback 3: Check conversation phase
    if (context.conversationPhase === 'ready_to_search') {
      console.log('✅ Conversation Phase Ready: Showing CTA button');
      return true;
    }

    console.log('❌ No conditions met: Hiding CTA button');
    return false;
  }, [showSearchButton]);

  // Enhanced context extraction with better validation
  const extractEnhancedContext = useCallback((message: string, currentContext: EnhancedNicoleContext): EnhancedNicoleContext => {
    const lowerMessage = message.toLowerCase();
    let updatedContext = { ...currentContext };

    // Enhanced relationship detection
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

    // Enhanced occasion detection
    const occasionPatterns = [
      { pattern: /birthday|turning \d+|\d+th birthday/i, occasion: 'birthday' },
      { pattern: /christmas|holiday/i, occasion: 'christmas' },
      { pattern: /anniversary/i, occasion: 'anniversary' },
      { pattern: /valentine/i, occasion: 'valentine\'s day' }
    ];

    for (const { pattern, occasion } of occasionPatterns) {
      if (pattern.test(message)) {
        updatedContext.occasion = occasion;
        break;
      }
    }

    // Enhanced budget extraction
    const budgetPatterns = [
      /around \$(\d+)/i,
      /about \$(\d+)/i,
      /\$(\d+)(?:\s*-\s*\$?(\d+))?/g,
      /under \$(\d+)/i,
      /up to \$(\d+)/i
    ];

    for (const pattern of budgetPatterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseInt(match[1]);
        if (!isNaN(amount) && amount > 0) {
          // Create a reasonable range around the stated amount
          const min = Math.max(10, Math.floor(amount * 0.7));
          const max = Math.ceil(amount * 1.3);
          updatedContext.budget = [min, max];
          console.log('💰 Budget extracted:', updatedContext.budget);
          break;
        }
      }
    }

    // Enhanced interest detection
    const interestKeywords = ['yoga', 'cooking', 'fitness', 'reading', 'music', 'art', 'sports', 'gaming', 'travel'];
    const foundInterests = interestKeywords.filter(interest => 
      lowerMessage.includes(interest)
    );

    if (foundInterests.length > 0) {
      updatedContext.interests = [
        ...new Set([...(updatedContext.interests || []), ...foundInterests])
      ];
    }

    return updatedContext;
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setMessages([{ role: "user", content: initialQuery }]);
      setAiContext(prev => ({ ...prev, searchQuery: initialQuery }));
    } else {
      setMessages([{ role: "assistant", content: "Hi, I'm Nicole! How can I help you find the perfect gift today?" }]);
    }
  }, [initialQuery]);

  // Update CTA button visibility when context or messages change
  useEffect(() => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    const shouldShow = shouldShowCTAButton(aiContext, lastAssistantMessage?.content);
    setShowSearchButton(shouldShow);
  }, [aiContext, messages, shouldShowCTAButton]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: NicoleMessage = {
      role: "user",
      content: currentMessage.trim()
    };

    // Extract context from user message
    const enhancedContext = extractEnhancedContext(currentMessage.trim(), aiContext);

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      const response = await chatWithNicole(
        currentMessage.trim(),
        messages.concat(userMessage),
        enhancedContext
      );

      // Clean the response to remove any embedded button text
      let cleanResponse = response.response;
      
      // Remove various forms of the embedded button text
      cleanResponse = cleanResponse.replace(/\[Ready to See Gifts\]/gi, '');
      cleanResponse = cleanResponse.replace(/Ready to See Gifts/gi, '');
      cleanResponse = cleanResponse.replace(/\*Ready to See Gifts\*/gi, '');
      cleanResponse = cleanResponse.replace(/\**Ready to See Gifts\**/gi, '');
      cleanResponse = cleanResponse.trim();

      const nicoleResponse: NicoleMessage = {
        role: "assistant",
        content: cleanResponse
      };
      
      const updatedMessages = [...messages, userMessage, nicoleResponse];
      setMessages(updatedMessages);
      
      // Merge contexts with Enhanced Zinc API preservation
      const mergedContext = {
        ...enhancedContext,
        ...(response.context || {}),
        // Preserve Enhanced Zinc fields
        detectedBrands: response.context?.detectedBrands || enhancedContext.detectedBrands || aiContext.detectedBrands,
        ageGroup: response.context?.ageGroup || enhancedContext.ageGroup || aiContext.ageGroup,
        exactAge: response.context?.exactAge || enhancedContext.exactAge || aiContext.exactAge,
        // Merge interests arrays
        interests: [
          ...new Set([
            ...(aiContext.interests || []),
            ...(enhancedContext.interests || []),
            ...(response.context?.interests || [])
          ])
        ]
      };
      
      setAiContext(mergedContext);
      
      console.log('🎯 Nicole: AI response received, context updated:', mergedContext);
      
    } catch (error) {
      console.error("Error in Nicole chat:", error);
      toast.error("Sorry, I had trouble connecting. Please try again.");
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having a bit of trouble. Could you please rephrase your request?" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateEnhancedSearchQuery = (context: EnhancedNicoleContext): string => {
    const {
      recipient,
      relationship,
      occasion,
      interests = [],
      detectedBrands = [],
      budget,
      exactAge
    } = context;
    
    // Enhanced brand-first query generation
    if (detectedBrands.length > 0) {
      let query = detectedBrands[0]; // Start with the first brand
      
      if (interests.length > 0) {
        query += ` ${interests[0]}`;
      }
      
      if (exactAge) {
        if (exactAge <= 12) query += " kids";
        else if (exactAge <= 19) query += " teens";
        else if (exactAge <= 35) query += " young adults";
        else if (exactAge <= 55) query += " adults";
        else query += " seniors";
      }
      
      if (occasion) {
        query += ` ${occasion}`;
      }
      
      return query.trim();
    }
    
    // Enhanced non-brand query generation
    let query = "";
    
    if (interests.length > 0) {
      query = interests.join(" ");
    }
    
    if (recipient && !exactAge) {
      query += query ? ` for ${recipient}` : `gifts for ${recipient}`;
    } else if (relationship && !recipient && !exactAge) {
      query += query ? ` for ${relationship}` : `gifts for ${relationship}`;
    }
    
    if (exactAge) {
      let ageGroup = "";
      if (exactAge <= 12) ageGroup = "kids";
      else if (exactAge <= 19) ageGroup = "teens";
      else if (exactAge <= 35) ageGroup = "young adults";
      else if (exactAge <= 55) ageGroup = "adults";
      else ageGroup = "seniors";
      
      query += query ? ` for ${ageGroup}` : `gifts for ${ageGroup}`;
    }
    
    if (occasion) {
      query += ` ${occasion}`;
    }
    
    if (budget) {
      const [min, max] = budget;
      query += ` under $${max}`;
    }
    
    return query.trim() || "gifts";
  };

  const handleSearchButtonClick = async () => {
    setIsGenerating(true);
    
    try {
      const searchQuery = generateEnhancedSearchQuery(aiContext);
      console.log('🔍 Enhanced Nicole: Generating search with context:', aiContext);
      console.log('🔍 Generated search query:', searchQuery);
      
      // Create comprehensive context with full conversation history
      const contextToStore = {
        fromNicole: true,
        searchQuery,
        conversationSummary: `Based on our conversation, I'm searching for: ${searchQuery}`,
        conversationHistory: messages,
        enhancedZincApiPreserved: true,
        marketplaceTransition: true,
        lastNicoleMessage: messages[messages.length - 1]?.content || '',
        timestamp: new Date().toISOString(),
        originalUserQuery: searchQuery,
        debugInfo: {
          originalContext: aiContext,
          searchGenerated: searchQuery,
          messageCount: messages.length,
          hasRecipient: Boolean(aiContext.recipient),
          hasOccasion: Boolean(aiContext.occasion),
          hasInterests: Boolean(aiContext.interests?.length),
          hasBudget: Boolean(aiContext.budget),
          hasDetectedBrands: Boolean(aiContext.detectedBrands?.length),
          conversationFlow: 'homepage-to-marketplace'
        },
        searchCriteria: {
          recipient: aiContext.recipient,
          relationship: aiContext.relationship,
          occasion: aiContext.occasion,
          exactAge: aiContext.exactAge,
          interests: aiContext.interests || [],
          budget: aiContext.budget,
          detectedBrands: aiContext.detectedBrands || []
        }
      };
      
      console.log('💾 Enhanced Nicole: Storing context for marketplace:', contextToStore);
      
      // Store in multiple locations to ensure persistence
      sessionStorage.setItem('nicoleContext', JSON.stringify(contextToStore));
      localStorage.setItem('nicoleMarketplaceContext', JSON.stringify(contextToStore));
      
      // Also store a flag to indicate fresh context
      sessionStorage.setItem('nicoleFreshContext', 'true');
      
      // Navigate to marketplace with search query
      onNavigateToResults(searchQuery);
      
      // Close the conversation engine
      onClose();
      
    } catch (error) {
      console.error('❌ Enhanced Nicole: Error generating search:', error);
      toast.error("Sorry, I had trouble generating your search. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 h-96 flex flex-col shadow-xl">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/ai-avatar.png" />
                <AvatarFallback className="bg-purple-100 text-purple-700">N</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Nicole</h3>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Gift Advisor
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                    message.role === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600">Nicole is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Smart CTA Button - Show based on intelligent fallback logic */}
            {showSearchButton && !isGenerating && (
              <div className="flex justify-center pt-2">
                <SearchButton 
                  onSearch={handleSearchButtonClick}
                  isLoading={isGenerating}
                />
              </div>
            )}
          </div>

          {/* Input - Only show if search button is not active */}
          {!showSearchButton && (
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 text-sm"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isGenerating}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNicoleConversationEngine;
