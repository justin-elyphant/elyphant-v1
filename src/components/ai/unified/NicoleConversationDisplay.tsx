
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, Sparkles, Bot } from 'lucide-react';
import TypingIndicator from '@/components/messaging/TypingIndicator';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Profile } from '@/types/profile';
import WishlistRecommendations from '@/components/ai/enhanced/WishlistRecommendations';
import ProductTilesDisplay from '@/components/ai/enhanced/ProductTilesDisplay';

interface Message {
  role: string;
  content?: string;
  type?: 'text' | 'recommendations' | 'product_tiles';
  payload?: any;
}

interface NicoleConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
  showSearchButton?: boolean;
  onSearch?: () => void;
  context?: any;
  onSelectRecommendation?: (item: any) => void;
  onProductTileAction?: (action: 'wishlist' | 'gift' | 'details', product: any) => void;
}

export const NicoleConversationDisplay: React.FC<NicoleConversationDisplayProps> = ({
  messages,
  isLoading = false,
  showSearchButton = false,
  onSearch,
  context,
  onSelectRecommendation,
  onProductTileAction,
}) => {
  const { profile } = useProfile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  
  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (scrollContainer) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
          
          // Only auto-scroll if user is near bottom or it's the first message
          if (isNearBottom || messages.length <= 1) {
            scrollContainer.scrollTo({
              top: scrollHeight,
              behavior: 'smooth'
            });
          }
          lastScrollTop.current = scrollTop;
        }
      }
    };
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, isLoading]);
  
  // Get user initials for fallback
  const getUserInitials = () => {
    if (profile?.name) {
      const nameParts = profile.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return 'U';
  };
  // Quick reply suggestions for ecommerce
  const quickReplies = [
    "Find gifts under $50",
    "Show trending items", 
    "Help me create a wishlist",
    "What's popular for holidays?"
  ];

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-transparent">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-end gap-3 animate-in slide-in-from-bottom-2 duration-300 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Avatar for assistant messages */}
            {message.role === 'assistant' && (
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-medium">
                  <Bot className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500/30 to-indigo-500/30 text-gray-800 border border-purple-400/30 rounded-br-md'
                  : 'bg-white/50 text-gray-800 border border-white/30 rounded-bl-md shadow-sm'
              }`}
            >
              {message.type === 'recommendations' ? (
                <div className="-mx-2">
                  <WishlistRecommendations
                    recommendations={message.payload?.recommendations || []}
                    userBudget={message.payload?.userBudget}
                    onSelectItem={(item) => onSelectRecommendation?.(item)}
                  />
                </div>
              ) : message.type === 'product_tiles' ? (
                <div className="-mx-2">
                  <ProductTilesDisplay
                    products={message.payload?.products || []}
                    onAddToWishlist={(product) => onProductTileAction?.('wishlist', product)}
                    onSendGift={(product) => onProductTileAction?.('gift', product)}
                    onViewDetails={(product) => onProductTileAction?.('details', product)}
                  />
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}
            </div>

            {/* Avatar for user messages */}
            {message.role === 'user' && (
              <Avatar className="w-6 h-6 flex-shrink-0">
                {profile?.profile_image && (
                  <AvatarImage src={profile.profile_image} alt="User avatar" />
                )}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-end gap-3 animate-in slide-in-from-bottom-2">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-medium">
                <Bot className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-white/50 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md backdrop-blur-sm border border-white/30">
              <TypingIndicator userName="Nicole" />
            </div>
          </div>
        )}
        
        {/* Quick Replies - Show after first message */}
        {messages.length > 0 && messages.length % 2 === 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 justify-center mt-6 animate-in fade-in-50 duration-500">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSearch && onSearch()}
                className="bg-white/30 backdrop-blur-sm border-purple-200/50 hover:bg-purple-50/50 hover:border-purple-300/50 text-purple-700 hover:text-purple-800 text-xs px-3 py-1 rounded-full transition-all duration-200"
              >
                {reply}
              </Button>
            ))}
          </div>
        )}
        
        {showSearchButton && (
          <div className="flex justify-center mt-6 animate-in slide-in-from-bottom-2 duration-300">
            <Button 
              onClick={onSearch} 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Products
              <Sparkles className="w-3 w-3 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
