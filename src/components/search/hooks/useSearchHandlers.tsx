
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { FriendSearchResult } from "@/services/search/friendSearchService";
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
      fullContext: JSON.stringify(nicoleContext, null, 2)
    });
    
    // Build marketplace URL with Nicole context
    const marketplaceUrl = new URL('/marketplace', window.location.origin);
    marketplaceUrl.searchParams.set('search', searchQuery);
    marketplaceUrl.searchParams.set('source', 'nicole');
    
    // Include budget information from multiple possible sources
    let minPrice, maxPrice;
    
    if (nicoleContext?.budget && Array.isArray(nicoleContext.budget) && nicoleContext.budget.length === 2) {
      [minPrice, maxPrice] = nicoleContext.budget;
      console.log('🎯 Budget extracted from context.budget array:', { minPrice, maxPrice });
    } else if (nicoleContext?.autoGiftIntelligence?.primaryRecommendation?.budgetRange) {
      [minPrice, maxPrice] = nicoleContext.autoGiftIntelligence.primaryRecommendation.budgetRange;
      console.log('🎯 Budget extracted from autoGiftIntelligence:', { minPrice, maxPrice });
    } else if (nicoleContext?.minPrice && nicoleContext?.maxPrice) {
      minPrice = nicoleContext.minPrice;
      maxPrice = nicoleContext.maxPrice;
      console.log('🎯 Budget extracted from direct minPrice/maxPrice:', { minPrice, maxPrice });
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
