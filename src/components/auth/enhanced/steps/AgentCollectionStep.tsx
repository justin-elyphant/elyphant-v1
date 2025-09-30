import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Gift } from "lucide-react";
import { useSimpleNicole } from "@/hooks/useSimpleNicole";

interface AgentCollectionStepProps {
  onComplete: (data: any) => void;
  suggestedIntent?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AgentCollectionStep: React.FC<AgentCollectionStepProps> = ({
  onComplete,
  suggestedIntent
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sendMessage,
    isLoading,
    context,
    updateContext
  } = useSimpleNicole();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = suggestedIntent === 'quick-gift' 
      ? "Hi! I'm Nicole, your AI gift advisor. I'll help you quickly find and send the perfect gift. Who are you shopping for today?"
      : "Hi! I'd love to help you find the perfect gift. Let's start with who you're shopping for - what's their name and how do you know them?";
    
    setMessages([{
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }]);

    // Set quick-gift context if suggested
    if (suggestedIntent === 'quick-gift') {
      updateContext({ conversationPhase: 'quick-gift' });
    }
  }, [suggestedIntent, updateContext]);

  // Note: In SimpleNicole, messages are managed by the hook
  // This component would need refactoring to work with the new architecture

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Check if ready to proceed to gift selection
  useEffect(() => {
    // Simplified completion logic
    if (context.recipient && context.occasion) {
      onComplete({
        recipientInfo: { name: context.recipient },
        occasion: context.occasion,
        budget: context.budget,
        conversationContext: context
      });
    }
  }, [context, onComplete]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await sendMessage(userMessage);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble right now. Could you try that again?",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  };

  const getCollectionProgress = () => {
    let progress = 0;
    if (context.recipient) progress += 40;
    if (context.occasion) progress += 30;
    if (context.budget) progress += 30;
    return progress;
  };

  return (
    <div className="flex flex-col h-full max-h-[60vh]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Quick Gift Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Let's find the perfect gift together
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCollectionProgress()}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getCollectionProgress() === 100 ? 'Ready to search!' : 'Collecting gift details...'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Nicole is typing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AgentCollectionStep;