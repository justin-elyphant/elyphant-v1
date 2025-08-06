
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

interface Message {
  role: string;
  content: string;
}

interface NicoleConversationDisplayProps {
  messages: Message[];
  isLoading?: boolean;
  showSearchButton?: boolean;
  onSearch?: () => void;
  context?: any;
}

export const NicoleConversationDisplay: React.FC<NicoleConversationDisplayProps> = ({
  messages,
  isLoading = false,
  showSearchButton = false,
  onSearch,
  context
}) => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Nicole is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {showSearchButton && (
          <div className="flex justify-center mt-4">
            <Button onClick={onSearch} className="bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4 mr-2" />
              Search Products
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
