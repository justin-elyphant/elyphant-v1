
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { ZincProduct } from "@/components/marketplace/zinc/types";

interface SearchHandlersProps {
  isNicoleMode: boolean;
  setQuery: (query: string) => void;
  setShowSuggestions: (show: boolean) => void;
  setShowNicoleDropdown: (show: boolean) => void;
  setShowMobileModal: (show: boolean) => void;
  setIsListening: (listening: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const useSearchHandlers = ({
  isNicoleMode,
  setQuery,
  setShowSuggestions,
  setShowNicoleDropdown,
  setShowMobileModal,
  setIsListening,
  inputRef
}: SearchHandlersProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent, query: string) => {
    e.preventDefault();
    if (isNicoleMode) {
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        setShowNicoleDropdown(true);
      }
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set("search", query);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isNicoleMode) {
      setQuery(suggestion);
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        setShowNicoleDropdown(true);
      }
      return;
    }

    setQuery(suggestion);
    const searchParams = new URLSearchParams();
    searchParams.set("search", suggestion);
    navigate(`/marketplace?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  const handleFriendSelect = (friend: FriendSearchResult) => {
    console.log(`🔍 [NAVIGATION] Navigating to profile:`, {
      id: friend.id,
      name: friend.name,
      username: friend.username,
      email: friend.email,
      url: `/profile/${friend.id}`
    });
    navigate(`/profile/${friend.id}`);
    setShowSuggestions(false);
  };

  const handleProductSelect = (product: ZincProduct) => {
    navigate(`/marketplace?search=${encodeURIComponent(product.title)}`);
    setShowSuggestions(false);
  };

  const handleBrandSelect = (brand: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(brand)}`);
    setShowSuggestions(false);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input not supported in this browser");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (isNicoleMode) {
        if (isMobile) {
          setShowMobileModal(true);
        } else {
          setShowNicoleDropdown(true);
        }
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleNicoleNavigateToResults = (searchQuery: string, nicoleContext?: any) => {
    console.log('🎯 HandleNicoleNavigateToResults: context received:', nicoleContext);
    console.log('🎯 DEBUGGING Nicole Context Budget:', {
      hasContext: !!nicoleContext,
      contextBudget: nicoleContext?.budget,
      budgetType: typeof nicoleContext?.budget,
      budgetIsArray: Array.isArray(nicoleContext?.budget),
      budgetLength: nicoleContext?.budget?.length,
      autoGiftBudget: nicoleContext?.autoGiftIntelligence?.primaryRecommendation?.budgetRange,
      allContextKeys: nicoleContext ? Object.keys(nicoleContext) : [],
      fullContext: nicoleContext
    });
    
    console.log('🎯 BUDGET EXTRACTION FLOW:');
    console.log('  1. Direct budget check:', nicoleContext?.budget);
    console.log('  2. AutoGift budget check:', nicoleContext?.autoGiftIntelligence?.primaryRecommendation?.budgetRange);
    console.log('  3. Interests check:', nicoleContext?.interests);
    console.log('  4. Recipient check:', nicoleContext?.recipient);
    
    // Build marketplace URL with Nicole context
    const marketplaceUrl = new URL('/marketplace', window.location.origin);
    marketplaceUrl.searchParams.set('search', searchQuery);
    marketplaceUrl.searchParams.set('source', 'nicole');
    
    // Include budget information from multiple possible sources
    let minPrice, maxPrice;
    
    // CRITICAL: Extract budget with enhanced debugging
    console.log('🎯 BUDGET EXTRACTION ATTEMPT 1: context.budget');
    if (nicoleContext?.budget && Array.isArray(nicoleContext.budget) && nicoleContext.budget.length === 2) {
      [minPrice, maxPrice] = nicoleContext.budget;
      console.log('🎯 ✅ SUCCESS: Budget extracted from context.budget array:', { minPrice, maxPrice });
    } 
    
    console.log('🎯 BUDGET EXTRACTION ATTEMPT 2: autoGiftIntelligence');
    if (!minPrice && !maxPrice && nicoleContext?.autoGiftIntelligence?.primaryRecommendation?.budgetRange) {
      [minPrice, maxPrice] = nicoleContext.autoGiftIntelligence.primaryRecommendation.budgetRange;
      console.log('🎯 ✅ SUCCESS: Budget extracted from autoGiftIntelligence:', { minPrice, maxPrice });
    } 
    
    console.log('🎯 BUDGET EXTRACTION ATTEMPT 3: direct properties');
    if (!minPrice && !maxPrice && nicoleContext?.minPrice && nicoleContext?.maxPrice) {
      minPrice = nicoleContext.minPrice;
      maxPrice = nicoleContext.maxPrice;
      console.log('🎯 ✅ SUCCESS: Budget extracted from direct minPrice/maxPrice:', { minPrice, maxPrice });
    }
    
    if (minPrice !== undefined && maxPrice !== undefined) {
      marketplaceUrl.searchParams.set('minPrice', String(minPrice));
      marketplaceUrl.searchParams.set('maxPrice', String(maxPrice));
      console.log('🎯 SUCCESS: Adding budget to URL:', { minPrice, maxPrice });
    } else {
      console.log('🎯 ERROR: No budget found in Nicole context:', {
        budget: nicoleContext?.budget,
        autoGiftBudget: nicoleContext?.autoGiftIntelligence?.primaryRecommendation?.budgetRange,
        contextKeys: nicoleContext ? Object.keys(nicoleContext) : [],
        fullContext: nicoleContext
      });
    }
    
    // Include recipient and occasion for contextual search
    if (nicoleContext?.recipient) {
      marketplaceUrl.searchParams.set('recipient', String(nicoleContext.recipient));
    }
    if (nicoleContext?.occasion) {
      marketplaceUrl.searchParams.set('occasion', String(nicoleContext.occasion));
    }
    
    console.log('🎯 Final marketplace URL:', marketplaceUrl.pathname + marketplaceUrl.search);
    navigate(marketplaceUrl.pathname + marketplaceUrl.search);
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
  };

  const handleCloseNicole = () => {
    setShowNicoleDropdown(false);
    setShowMobileModal(false);
    // Clean up URL params
    const params = new URLSearchParams(location.search);
    params.delete("mode");
    params.delete("open");
    if (params.toString()) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  };

  return {
    handleSubmit,
    handleSuggestionClick,
    handleFriendSelect,
    handleProductSelect,
    handleBrandSelect,
    handleVoiceInput,
    handleNicoleNavigateToResults,
    handleCloseNicole
  };
};
