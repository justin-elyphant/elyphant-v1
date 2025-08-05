import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Loader2, Sparkles, Gift, Search, DollarSign, Heart } from 'lucide-react';
import { NicoleCapability, UnifiedNicoleContext, NicoleResponse } from '@/services/ai/unified/types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  capability?: NicoleCapability;
  actions?: string[];
}

interface NicoleConversationInterfaceProps {
  context: UnifiedNicoleContext;
  lastResponse: NicoleResponse | null;
  loading: boolean;
  onSendMessage: (message: string) => Promise<NicoleResponse | null>;
  onUpdateContext: (updates: Partial<UnifiedNicoleContext>) => void;
  capability: NicoleCapability;
  onCapabilityChange: (capability: NicoleCapability) => void;
  onIntentComplete?: (intent: string) => void;
  entryPoint?: string;
}

const NicoleConversationInterface: React.FC<NicoleConversationInterfaceProps> = ({
  context,
  lastResponse,
  loading,
  onSendMessage,
  onUpdateContext,
  capability,
  onCapabilityChange,
  onIntentComplete,
  entryPoint
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Add initial greeting message
  useEffect(() => {
    if (lastResponse && messages.length === 0) {
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: lastResponse.message,
        timestamp: new Date(),
        capability: lastResponse.capability,
        actions: lastResponse.actions
      }]);
    }
  }, [lastResponse]);

  // Add new messages when Nicole responds
  useEffect(() => {
    if (lastResponse && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: lastResponse.message,
          timestamp: new Date(),
          capability: lastResponse.capability,
          actions: lastResponse.actions
        }]);
      }
    }
  }, [lastResponse]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // Send to Nicole
    await onSendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'start_auto_gifting':
        onCapabilityChange('auto_gifting');
        onSendMessage('I want to set up auto-gifting');
        break;
      case 'browse_marketplace':
        navigate('/marketplace');
        break;
      case 'create_wishlist':
        navigate('/wishlists/new');
        break;
      case 'show_search_button':
        if (lastResponse?.searchQuery) {
          navigate(`/marketplace?q=${encodeURIComponent(lastResponse.searchQuery)}`);
        }
        break;
      case 'search_ready':
        if (lastResponse?.searchQuery) {
          navigate(`/marketplace?q=${encodeURIComponent(lastResponse.searchQuery)}`);
        }
        break;
    }
  };

  const getCapabilityIcon = (cap: NicoleCapability) => {
    switch (cap) {
      case 'gift_advisor':
      case 'auto_gifting':
        return <Gift className="h-3 w-3" />;
      case 'search':
      case 'marketplace_assistant':
        return <Search className="h-3 w-3" />;
      case 'budget_analysis':
        return <DollarSign className="h-3 w-3" />;
      case 'wishlist_analysis':
        return <Heart className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getCapabilityColor = (cap: NicoleCapability) => {
    switch (cap) {
      case 'gift_advisor':
      case 'auto_gifting':
        return 'bg-purple-100 text-purple-700';
      case 'search':
      case 'marketplace_assistant':
        return 'bg-blue-100 text-blue-700';
      case 'budget_analysis':
        return 'bg-green-100 text-green-700';
      case 'wishlist_analysis':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Quick action suggestions based on capability
  const getQuickActions = () => {
    const actions = lastResponse?.actions || [];
    return actions.map(action => {
      switch (action) {
        case 'show_search_button':
          return {
            label: 'Search Products',
            action: 'show_search_button',
            icon: <Search className="h-4 w-4" />
          };
        case 'start_auto_gifting':
          return {
            label: 'Set Up Auto-Gifting',
            action: 'start_auto_gifting',
            icon: <Gift className="h-4 w-4" />
          };
        case 'search_ready':
          return {
            label: 'Find Gifts',
            action: 'search_ready',
            icon: <Search className="h-4 w-4" />
          };
        default:
          return null;
      }
    }).filter(Boolean);
  };

  const quickActions = getQuickActions();

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === 'assistant' ? (
                    <>
                      <AvatarImage src="/nicole-avatar.png" alt="Nicole" />
                      <AvatarFallback className="bg-purple-100 text-purple-600">N</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt="You" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user?.user_metadata?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className="space-y-2">
                  <Card className={`${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border-gray-200'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Show capability badge for Nicole messages */}
                  {message.role === 'assistant' && message.capability && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCapabilityColor(message.capability)}`}
                      >
                        {getCapabilityIcon(message.capability)}
                        <span className="ml-1 capitalize">
                          {message.capability.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-600">N</AvatarFallback>
                </Avatar>
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Nicole is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="text-xs"
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !inputValue.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicoleConversationInterface;