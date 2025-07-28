import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Search, Gift } from 'lucide-react';
import { useNicoleState } from '@/contexts/nicole/NicoleStateContext';
import { useUnifiedNicoleAI } from '@/hooks/useUnifiedNicoleAI';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchParams } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth/useAuthSession';
import { getNicoleGreeting, getGreetingFromUrl } from '@/utils/nicoleGreetings';
import { cn } from '@/lib/utils';

interface NicoleUnifiedInterfaceProps {
  onNavigateToResults?: (query: string) => void;
  className?: string;
}

export const NicoleUnifiedInterface: React.FC<NicoleUnifiedInterfaceProps> = ({
  onNavigateToResults,
  className
}) => {
  const { state, actions } = useNicoleState();
  const { user } = useAuthSession();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get greeting context from URL and user data
  const greetingContext = {
    ...getGreetingFromUrl(searchParams),
    userProfile: user,
    activeMode: state.activeMode
  };
  
  console.log("🎯 Nicole Interface - Greeting Context:", greetingContext);
  
  const {
    chatWithNicole,
    loading,
    lastResponse,
    isReadyToSearch,
    generateSearchQuery,
    clearConversation
  } = useUnifiedNicoleAI({
    sessionId: state.sessionId,
    onResponse: (response) => {
      // Handle search button logic
      if (response.showSearchButton && onNavigateToResults) {
        const query = generateSearchQuery();
        if (query) {
          onNavigateToResults(query);
        }
      }
    }
  });

  // Auto-focus input when interface becomes active
  useEffect(() => {
    if (state.activeMode !== 'closed' && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.activeMode]);

  const handleClose = () => {
    actions.closeAllModes();
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || loading) return;
    await chatWithNicole(message);
  };

  const handleSearchNow = () => {
    const query = generateSearchQuery();
    if (query && onNavigateToResults) {
      onNavigateToResults(query);
      actions.closeAllModes();
    }
  };

  const getCapabilityIcon = () => {
    switch (state.activeMode) {
      case 'search':
        return <Search className="w-4 h-4" />;
      case 'floating':
        return <Gift className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTitle = () => {
    switch (state.activeMode) {
      case 'search':
        return 'Nicole - Your Shopping Buddy';
      case 'floating':
        return 'Nicole - Gift Obsessed Friend';
      default:
        return 'Nicole - Your Gift Guru';
    }
  };

  if (state.activeMode === 'closed') {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bg-background/95 backdrop-blur-sm border shadow-lg z-50",
      "transition-all duration-300 ease-in-out",
      {
        // Mobile styling
        "inset-x-4 bottom-4 top-20": isMobile,
        // Desktop styling - floating mode
        "bottom-4 right-4 w-96 h-[500px]": !isMobile && state.activeMode === 'floating',
        // Desktop styling - search mode
        "top-16 left-1/2 -translate-x-1/2 w-[600px] h-[400px]": !isMobile && state.activeMode === 'search',
      },
      state.isTransitioning && "opacity-50 scale-95",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {getCapabilityIcon()}
          <h3 className="font-semibold text-sm">{getTitle()}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
          {lastResponse ? (
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{lastResponse.message}</p>
              </div>
              
              {/* Search Button */}
              {isReadyToSearch() && (
                <Button 
                  onClick={handleSearchNow}
                  className="w-full"
                  disabled={loading}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Now
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="mb-4">
                {getCapabilityIcon()}
              </div>
              <p className="text-sm">
                {getNicoleGreeting(greetingContext)}
              </p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const message = formData.get('message') as string;
            handleSendMessage(message);
            e.currentTarget.reset();
          }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                name="message"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                disabled={loading}
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={loading}
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};