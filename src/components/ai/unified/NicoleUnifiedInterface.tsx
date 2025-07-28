import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MessageCircle, Search, Gift, Sparkles, Send } from 'lucide-react';
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
      "fixed bg-background/95 backdrop-blur-xl border border-purple-200/30 shadow-xl z-50",
      "transition-all duration-300 ease-in-out rounded-2xl",
      "ring-1 ring-purple-100/20",
      {
        // Mobile styling
        "inset-x-4 bottom-4 top-20": isMobile,
        // Desktop styling - floating mode
        "bottom-4 right-4 w-96 h-[500px]": !isMobile && state.activeMode === 'floating',
        // Desktop styling - search mode
        "top-16 left-1/2 -translate-x-1/2 w-[600px] h-[500px]": !isMobile && state.activeMode === 'search',
      },
      state.isTransitioning && "opacity-50 scale-95",
      className
    )}>
      {/* Header with gradient background */}
      <div className="flex items-center justify-between p-4 border-b border-purple-100/30 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            {getCapabilityIcon()}
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-purple-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {getTitle()}
            </h3>
            <Badge variant="secondary" className="text-xs bg-purple-100/60 text-purple-600 border-0">
              AI Assistant
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0 hover:bg-purple-100/60 rounded-full transition-colors duration-200"
        >
          <X className="w-4 h-4 text-purple-600" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 bg-gradient-to-b from-purple-50/20 to-transparent">
          {lastResponse ? (
            <div className="space-y-4">
              {/* Nicole's response bubble */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 p-4 rounded-2xl rounded-tl-md shadow-sm">
                    <p className="text-sm text-foreground leading-relaxed">{lastResponse.message}</p>
                  </div>
                </div>
              </div>
              
              {/* Search Button */}
              {isReadyToSearch() && (
                <div className="flex justify-center pt-2">
                  <Button 
                    onClick={handleSearchNow}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Now
                    <Sparkles className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  {getCapabilityIcon()}
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-purple-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Hey there! 👋
                </h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {getNicoleGreeting(greetingContext)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Unified Modal Design */}
        <div className="border-t border-border/20 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-md rounded-b-2xl">
          <div className="p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const message = formData.get('message') as string;
              handleSendMessage(message);
              e.currentTarget.reset();
            }}>
              <div className="relative flex items-center gap-3">
                <input
                  ref={inputRef}
                  name="message"
                  placeholder="Ask Nicole anything about gifts..."
                  className="flex-1 px-4 py-3 pr-12 text-sm border border-border/30 rounded-2xl bg-card/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-card/70 transition-all duration-200 shadow-sm"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="absolute right-2 h-8 w-8 p-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Card>
  );
};