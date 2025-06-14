
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

  const handleNicoleNavigateToResults = (searchQuery: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
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
