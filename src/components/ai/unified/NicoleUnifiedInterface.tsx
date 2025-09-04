
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Sparkles, Bot } from 'lucide-react';
import { useUnifiedNicoleAI } from '@/hooks/useUnifiedNicoleAI';
import { NicoleConversationDisplay } from './NicoleConversationDisplay';
import { NicoleInputArea } from './NicoleInputArea';
import { NicoleCapability } from '@/services/ai/unified/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { useEnhancedGiftRecommendations } from '@/hooks/useEnhancedGiftRecommendations';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { Product } from '@/types/product';

interface NicoleUnifiedInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: {
    capability?: string;
    selectedIntent?: string;
    userFirstName?: string;
    greetingContext?: any;
  };
  className?: string;
  // Additional props for backward compatibility
  entryPoint?: string;
  onIntentComplete?: (intent: "auto-gift" | "shop-solo" | "create-wishlist" | "giftor") => void;
  onNavigateToResults?: (searchQuery: string, nicoleContext?: any) => void;
}

interface Message {
  role: string;
  content?: string;
  type?: 'text' | 'recommendations' | 'product_tiles';
  payload?: any;
}

export const NicoleUnifiedInterface: React.FC<NicoleUnifiedInterfaceProps> = ({
  isOpen,
  onClose,
  initialContext,
  className = "",
  entryPoint,
  onIntentComplete,
  onNavigateToResults
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Curated flow state
  const [curatedActive, setCuratedActive] = useState(false);
  const [curatedFlow, setCuratedFlow] = useState<{
    status: 'idle' | 'collecting' | 'ready_to_search' | 'showing_recs';
    budget?: [number, number];
    preferences: string[];
    hint?: string;
  }>({ status: 'idle', preferences: [] });

  // Recommendations hook
  const { generateRecommendations, trackRecommendationEvent, lastResponse: recLastResponse } = useEnhancedGiftRecommendations();
  
  // Search hook for product tiles and marketplace intelligence
  const { searchProducts } = useUnifiedSearch({ maxResults: 12 });
  
  // Nicole marketplace intelligence integration
  const [nicoleIntelligenceActive, setNicoleIntelligenceActive] = useState(false);
  // Convert string capability to proper NicoleCapability type
  const getCapabilityFromString = (capabilityString?: string): NicoleCapability => {
    switch (capabilityString) {
      case 'auto_gifting':
      case 'auto-gifting':
        return 'auto_gifting';
      case 'gift_advisor':
      case 'gift-advisor':
        return 'gift_advisor';
      case 'search':
        return 'search';
      case 'marketplace_assistant':
      case 'marketplace-assistant':
        return 'marketplace_assistant';
      default:
        return 'conversation';
    }
  };

  // Build enhanced initial context from props
  const buildInitialContext = () => {
    const baseContext = {
      capability: getCapabilityFromString(initialContext?.capability),
      selectedIntent: initialContext?.selectedIntent as "auto-gift" | "shop-solo" | "create-wishlist" | "giftor" | undefined,
      userFirstName: initialContext?.userFirstName,
      greetingContext: initialContext?.greetingContext,
      conversationPhase: 'greeting' as const
    };

    // Add entry point context for Hero component compatibility
    if (entryPoint) {
      baseContext.greetingContext = {
        ...baseContext.greetingContext,
        entryPoint
      };
    }

    return baseContext;
  };

  const {
    chatWithNicole,
    loading,
    lastResponse,
    clearConversation,
    isReadyToSearch,
    getConversationContext,
    updateContext,
    generateSearchQuery
  } = useUnifiedNicoleAI({
    initialContext: buildInitialContext(),
    onResponse: async (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      
      // Handle product tiles display when Nicole provides search context
      if (response.showProductTiles) {
        const query = response.searchQuery || 'popular gifts';
        console.log('🛍️ [NICOLE MARKETPLACE] Fetching products for tiles with query:', query);
        
        try {
          // Check if we should use Nicole's marketplace intelligence
          const currentContext = getConversationContext();
          setNicoleIntelligenceActive(true);
          
          // Use enhanced marketplace intelligence if context is available
          if (currentContext && (currentContext.recipient || currentContext.occasion)) {
            console.log('🤖 Using Nicole marketplace intelligence with context:', currentContext);
            
            // Import and use Nicole marketplace intelligence
            const { nicoleMarketplaceIntelligenceService } = await import('@/services/gifting/NicoleMarketplaceIntelligenceService');
            
            const intelligenceResult = await nicoleMarketplaceIntelligenceService.getCuratedProducts({
              recipient_id: currentContext.recipient,
              recipient_name: currentContext.recipient,
              relationship: currentContext.relationship,
              occasion: currentContext.occasion,
              budget: currentContext.budget,
              interests: currentContext.interests,
              conversation_history: messages.filter(m => m.role === 'user').map(m => m.content || ''),
              confidence_threshold: 0.4
            });
            
            if (intelligenceResult.recommendations.length > 0) {
              console.log(`🎯 Nicole Intelligence found ${intelligenceResult.recommendations.length} curated products`);
              
              // Convert recommendations to products for display
              const curatedProducts = intelligenceResult.recommendations.map(rec => rec.product);
              
              setMessages(prev => [...prev, {
                role: 'assistant',
                type: 'product_tiles',
                payload: { 
                  products: curatedProducts,
                  nicoleIntelligence: true,
                  intelligenceSource: intelligenceResult.intelligence_source,
                  totalAnalyzed: intelligenceResult.total_products_analyzed
                }
              }]);
            } else {
              // Fallback to regular search if no intelligent recommendations
              const products = await searchProducts(query, { maxResults: 12 });
              if (products.length > 0) {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  type: 'product_tiles',
                  payload: { products }
                }]);
              }
            }
          } else {
            // Regular product search without intelligence
            const products = await searchProducts(query, { maxResults: 12 });
            console.log('🎯 Found', products.length, 'products for tiles');
            if (products.length > 0) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                type: 'product_tiles',
                payload: { products }
              }]);
            } else {
              console.warn('No products found for tiles, query:', query);
            }
          }
        } catch (error) {
          console.error('Failed to fetch products for tiles:', error);
          // Fallback to regular search on error
          try {
            const products = await searchProducts(query, { maxResults: 12 });
            if (products.length > 0) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                type: 'product_tiles',
                payload: { products }
              }]);
            }
          } catch (fallbackError) {
            console.error('Fallback search also failed:', fallbackError);
          }
        } finally {
          setNicoleIntelligenceActive(false);
        }
      }
      
      // Handle intent completion callback for Hero component
      if (onIntentComplete && response.metadata?.contextUpdates?.selectedIntent) {
        onIntentComplete(response.metadata.contextUpdates.selectedIntent);
      }
    }
  });

  // Send auto-greeting when interface opens (wait for context to be ready)
  useEffect(() => {
    if (isOpen && messages.length === 0 && !loading) {
      console.log('🚀 Starting auto-greeting with Nicole');
      
      // Small delay to ensure user context is loaded
      const timer = setTimeout(async () => {
        try {
          // Use special trigger to get personalized auto-greeting
          const response = await chatWithNicole("__START_DYNAMIC_CHAT__");
          if (response) {
            setMessages([
              { role: 'assistant', content: response.message }
            ]);
          }
        } catch (error) {
          console.error('Failed to send auto-greeting:', error);
          // Fallback with personalized greeting
          const fallbackMessage = initialContext?.selectedIntent === 'auto-gift' 
            ? "Hey there! Ready to set up some auto-gifting magic? I'll help you never miss an important occasion again!"
            : "Hey there! I'm Nicole, your gift guru. What can I help you with today?";
          
          setMessages([
            { role: 'assistant', content: fallbackMessage }
          ]);
        }
      }, 500); // Wait 500ms for context to load
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, loading, chatWithNicole, initialContext]);

  // --- Curated flow helpers ---
  const clamp = (n: number, min = 5, max = 5000) => Math.max(min, Math.min(max, n));
  const extractBudget = (text: string): [number, number] | undefined => {
    const t = text.toLowerCase();
    const rangeMatch = t.match(/\$?\s*(\d{1,5})\s*[-to]+\s*\$?\s*(\d{1,5})/);
    if (rangeMatch) {
      const a = clamp(parseInt(rangeMatch[1], 10));
      const b = clamp(parseInt(rangeMatch[2], 10));
      return [Math.min(a, b), Math.max(a, b)];
    }
    const underMatch = t.match(/(under|below)\s*\$?\s*(\d{1,5})/);
    if (underMatch) {
      const b = clamp(parseInt(underMatch[2], 10));
      return [5, b];
    }
    const aroundMatch = t.match(/(around|about|~)\s*\$?\s*(\d{1,5})/);
    if (aroundMatch) {
      const n = clamp(parseInt(aroundMatch[2], 10));
      return [clamp(Math.floor(n * 0.8)), clamp(Math.ceil(n * 1.2))];
    }
    const single = t.match(/\$?\s*(\d{1,5})/);
    if (single) {
      const n = clamp(parseInt(single[1], 10));
      return [clamp(Math.floor(n * 0.8)), clamp(Math.ceil(n * 1.2))];
    }
    return undefined;
  };

  const extractPreferences = (text: string): string[] => {
    return text
      .toLowerCase()
      .split(/,| and | & |\n|\r/g)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !s.match(/^\$?\d+/));
  };

  const computeScheduleDate = (ctx: any, daysBefore = 7): string => {
    try {
      let target = new Date();
      if (ctx?.eventDate) {
        const d = new Date(ctx.eventDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() - daysBefore);
          target = d;
        }
      } else {
        target.setDate(target.getDate() + 7);
      }
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2);
      if (target < minDate) target = minDate;
      return target.toISOString();
    } catch {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString();
    }
  };

  const mapToWishlistRecs = (prods: any[], budget?: [number, number]) => {
    return (prods || []).map((p: any) => {
      const inBudget = budget ? (p.price >= budget[0] && p.price <= budget[1]) : false;
      const priority = p.matchScore >= 0.8 ? 'high' : p.matchScore >= 0.6 ? 'medium' : 'low';
      return {
        item: {
          id: p.productId,
          title: p.title,
          name: p.title,
          price: p.price,
          image_url: p.imageUrl,
          brand: p.vendor,
          url: p.purchaseUrl
        },
        inBudget,
        priority,
        reasoning: Array.isArray(p.matchReasons) ? p.matchReasons.join(' • ') : (p.description || '')
      } as any;
    });
  };

  const showRecommendations = async (budget: [number, number] | undefined, prefs: string[]) => {
    const ctx = getConversationContext() as any;
    try {
      const response = await generateRecommendations(
        {
          recipient: ctx.recipient,
          relationship: ctx.relationship,
          occasion: ctx.occasion,
          budget: budget as any,
          interests: prefs,
          giftType: 'wishlist_based'
        },
        ctx.recipient_id || ctx.recipient,
        undefined,
        { maxRecommendations: 8, includeExplanations: true, fallbackToGeneric: true }
      );

      const mapped = mapToWishlistRecs(response?.recommendations || [], budget);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', type: 'recommendations', payload: { recommendations: mapped, userBudget: budget } }
      ]);

      try {
        const recId = (response as any)?.analytics?.recommendationId;
        if (recId) {
          for (const m of mapped.slice(0, 5)) {
            await trackRecommendationEvent(recId, 'viewed', { productId: m.item?.id });
          }
        }
      } catch {}

      setCuratedFlow(prev => ({ ...prev, status: 'showing_recs' }));
    } catch (e) {
      console.error('Failed to generate recommendations', e);
      toast.error('Could not fetch ideas right now');
    }
  };

  const handleSelectFromWidget = async (rec: any) => {
    const ctx = getConversationContext() as any;
    if (!user?.id) {
      toast.error("Please log in to schedule a gift");
      return;
    }

    // Track click
    try {
      const recId = (recLastResponse as any)?.analytics?.recommendationId;
      if (recId) {
        await trackRecommendationEvent(recId, 'clicked', {
          productId: rec?.item?.id,
          price: rec?.item?.price,
        });
      }
    } catch {}

    const scheduleDate = computeScheduleDate(ctx, 7);
    const budgetObj = curatedFlow.budget
      ? { min: curatedFlow.budget[0], max: curatedFlow.budget[1] }
      : (Array.isArray(ctx?.budget) && ctx.budget.length === 2
        ? { min: Number(ctx.budget[0]), max: Number(ctx.budget[1]) }
        : {});

    try {
      const autoGiftSetupEvent = new CustomEvent('openAutoGiftSetup', {
        detail: {
          recipientName: String(ctx.recipient),
          occasion: String(ctx.occasion),
          budget: budgetObj
        }
      });
      window.dispatchEvent(autoGiftSetupEvent);
      toast.success("Opening auto-gift setup...");

      toast.success('Gift scheduled');
      setMessages(prev => [...prev, { role: 'assistant', content: `Done! I’ll order ${rec?.item?.title || rec?.item?.name} ahead of ${String(ctx.recipient)}'s ${String(ctx.occasion)}. You’ll get a heads-up before it goes through.` }]);
      try {
        updateContext({ mode: 'curated', selectedProduct: rec?.item, scheduleDate } as any);
      } catch {}
      setCuratedActive(false);
      setCuratedFlow({ status: 'idle', preferences: [] });
    } catch (e) {
      console.error('Auto-gift setup failed', e);
      toast.error("Couldn't open auto-gift setup");
      setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't open the auto-gift setup just now. Want me to try a different approach?" }]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Don't add auto-greeting triggers to message display
    if (message !== "__START_DYNAMIC_CHAT__") {
      // Add user message to display
      setMessages(prev => [...prev, { role: 'user', content: message }]);
    }

    // Lightweight context extraction (helps trigger CTA if backend didn't tag it)
    const lower = message.toLowerCase();
    const occ = lower.includes('birthday') ? 'birthday'
      : lower.includes('anniversary') ? 'anniversary'
      : lower.includes('christmas') ? 'christmas'
      : undefined;
    if (occ) { try { updateContext({ occasion: occ } as any); } catch {} }

    // Send to Nicole and get response
    const response = await chatWithNicole(message);
    
    if (response) {
      // Add Nicole's response to display (only if not already added by auto-greeting)
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage?.content === response.message) {
          return prev; // Don't duplicate
        }
        return [...prev, { role: 'assistant', content: response.message }];
      });
    }
  };

  const handleProductTileAction = async (action: 'wishlist' | 'gift' | 'details', product: Product) => {
    console.log(`Product tile ${action}:`, product);
    
    switch (action) {
      case 'wishlist':
        toast.success(`${product.title || product.name} added to wishlist`);
        break;
      case 'gift':
        const ctx = getConversationContext() as any;
        if (ctx.recipient) {
          toast.success(`Gift scheduled for ${ctx.recipient}`);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Perfect! I'll schedule ${product.title || product.name} for ${ctx.recipient}. You'll get a notification before it's sent.` 
          }]);
        } else {
          toast.info('Please specify who this gift is for');
        }
        break;
      case 'details':
        // You could navigate to product details page here
        toast.info('Product details coming soon');
        break;
    }
  };

  const handleSearch = () => {
    const searchQuery = lastResponse?.searchQuery || '';
    console.log('🎯 handleSearch called - lastResponse:', lastResponse);
    console.log('🎯 searchQuery from lastResponse:', searchQuery);
    console.log('🎯 generateSearchQuery():', generateSearchQuery());
    
    // Fallback to generated search query if lastResponse doesn't have one
    const finalSearchQuery = searchQuery || generateSearchQuery();
    console.log('🎯 Final search query to use:', finalSearchQuery);
    
    // Use onNavigateToResults callback if provided (for AIEnhancedSearchBar)
    if (onNavigateToResults) {
      console.log('🎯 Using onNavigateToResults callback');
      // Pass the Nicole context along with the search query
      const nicoleContext = getConversationContext();
      console.log('🎯 Nicole context for navigation:', nicoleContext);
      onNavigateToResults(finalSearchQuery, nicoleContext);
      // Don't close immediately - let the parent handle closure after navigation
      return;
    }
    
    // Default behavior: dispatch custom event
    console.log('🎯 Triggering marketplace search with Nicole context, searchQuery:', finalSearchQuery);
    onClose();
    
    // Dispatch the event with Nicole context for budget filtering
    const context = getConversationContext();
    const event = new CustomEvent('nicole-search', {
      detail: { 
        searchQuery: finalSearchQuery,
        nicoleContext: context // Pass the full Nicole context including budget
      }
    });
    console.log('📡 Dispatching nicole-search event with context:', event);
    window.dispatchEvent(event);
  };

  // Smart Auto-Gift CTA state and handler
  const { user } = useAuth();
  const [isSettingUpAutoGift, setIsSettingUpAutoGift] = useState(false);
  const [showAutoGiftChoice, setShowAutoGiftChoice] = useState(false);

  const handleOfferAutoGift = () => {
    setShowAutoGiftChoice(true);
  };

  const setupAutoGiftFromContext = async () => {
    const ctx = getConversationContext() as any;
    if (!user?.id) {
      toast.error("Please log in to set up auto-gifting");
      return;
    }
    try {
      setIsSettingUpAutoGift(true);
      const budget = Array.isArray(ctx?.budget) && ctx.budget.length === 2
        ? { min: Number(ctx.budget[0]), max: Number(ctx.budget[1]) }
        : {};

      const autoGiftSetupEvent = new CustomEvent('openAutoGiftSetup', {
        detail: {
          recipientName: String(ctx.recipient),
          occasion: String(ctx.occasion),
          budget
        }
      });
      window.dispatchEvent(autoGiftSetupEvent);
      toast.success("Opening auto-gift setup...");

      setMessages(prev => [...prev, { role: 'assistant', content: `I'll help you set up auto-gifting for ${String(ctx.recipient)}'s ${String(ctx.occasion)}. The setup flow will guide you through the process.` }]);
      try {
        await chatWithNicole(`All set! I've opened the auto-gift setup for ${String(ctx.recipient)}'s ${String(ctx.occasion)}. Follow the steps to complete the configuration.`);
      } catch {}
    } catch (e) {
      console.error('Auto-gift setup error', e);
      toast.error("Couldn't set up auto-gifting right now");
      // Keep the conversation going even on failure
      try {
        await chatWithNicole(`I couldn't set up auto-gifting just now. What budget should we use for ${String(ctx.recipient)}'s ${String(ctx.occasion)} so I can try again?`);
      } catch {}
    } finally {
      setIsSettingUpAutoGift(false);
    }
  };

  const handleHandsFree = async () => {
    setShowAutoGiftChoice(false);
    await setupAutoGiftFromContext();
  };

  const handleCurated = async () => {
    setShowAutoGiftChoice(false);
    try {
      setCuratedActive(true);
      setCuratedFlow({ status: 'collecting', preferences: [] });
      updateContext?.({ capability: 'gift_advisor' } as any);
      await chatWithNicole("Great — let's curate together. Tell me 1-2 interests or brands they love, and your target price range. You can also say 'show ideas' to skip.");
    } catch {}
  };

  if (!isOpen) return null;

  // Force inline positioning for all instances to appear below search bar
  const isInline = true; // Always use inline positioning

  return (
    <div className={`relative w-full h-[500px] md:h-[600px] flex flex-col rounded-3xl shadow-lg border border-white/20 bg-white/60 backdrop-blur-md ${className}`}>
      {/* Enhanced Visual Connection Line to Search Bar */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-purple-500 via-purple-400 to-transparent opacity-80 shadow-sm shadow-purple-400/50"></div>
      
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-3xl p-4 border-b border-purple-400/20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">Chat with Nicole</h3>
              <Sparkles className="h-3 w-3 text-purple-200 animate-pulse" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 hover:bg-white/20 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation Display */}
      <NicoleConversationDisplay
        messages={messages}
        isLoading={loading}
        showSearchButton={isReadyToSearch()}
        onSearch={handleSearch}
        onSelectRecommendation={(item) => handleSelectFromWidget(item)}
      />

      {/* Smart Auto-Gift CTA (proactive) */}
      {(() => {
        const ctx = getConversationContext() as any;
        const canOffer = Boolean(ctx?.recipient && ctx?.occasion);
        return canOffer ? (
          <div className="px-4 pt-2">
            <Button
              onClick={handleOfferAutoGift}
              disabled={isSettingUpAutoGift}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isSettingUpAutoGift ? 'Setting up...' : `Set up auto-gifting for ${String(ctx.recipient)}'s ${String(ctx.occasion)}`}
            </Button>
          </div>
        ) : null;
      })()}

      {/* Auto-Gift choice dialog */}
      <Dialog open={showAutoGiftChoice} onOpenChange={setShowAutoGiftChoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How should we handle this gift?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Button onClick={handleHandsFree} disabled={isSettingUpAutoGift}>
              <Sparkles className="h-4 w-4 mr-2" />
              Let Nicole handle it (hands-free)
            </Button>
            <Button variant="outline" onClick={handleCurated} disabled={isSettingUpAutoGift}>
              Let's curate together
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Input Area */}
      <NicoleInputArea
        onSendMessage={handleSendMessage}
        disabled={loading}
        placeholder="Type your message..."
      />
    </div>
  );
};

export default NicoleUnifiedInterface;
