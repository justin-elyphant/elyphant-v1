/**
 * NICOLE APPROVAL INTERFACE
 * 
 * Conversational approval interface for auto-gifting executions using Nicole AI.
 * This provides an alternative to email approvals with real-time chat capabilities.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, CheckCircle, XCircle, MessageCircle, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { nicoleAIService } from '@/services/ai/unified/nicoleAIService';
import { enhancedAutoGiftingService } from '@/services/enhanced-auto-gifting-service';
import { toast } from 'sonner';

interface ApprovalMessage {
  id: string;
  role: 'user' | 'nicole';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface NicoleApprovalInterfaceProps {
  executionId: string;
  conversationId: string;
  selectedProducts: any[];
  totalAmount: number;
  eventDetails: any;
  onApprovalComplete: (decision: 'approve' | 'reject', method: 'nicole_chat') => void;
  onClose: () => void;
}

const NicoleApprovalInterface: React.FC<NicoleApprovalInterfaceProps> = ({
  executionId,
  conversationId,
  selectedProducts,
  totalAmount,
  eventDetails,
  onApprovalComplete,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ApprovalMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<'active' | 'completed'>('active');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      
      // Get existing conversation or initialize with Nicole's greeting
      const initialMessage: ApprovalMessage = {
        id: '1',
        role: 'nicole',
        content: `Hello! I've analyzed your upcoming ${eventDetails.event_type} and selected some thoughtful gifts. Let me show you what I found and we can discuss any adjustments you'd like to make.`,
        timestamp: new Date().toISOString()
      };

      setMessages([initialMessage]);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast.error('Failed to initialize approval conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ApprovalMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get Nicole's response
      const nicoleResponse = await nicoleAIService.continueApprovalConversation(
        conversationId,
        inputMessage
      );

      const nicoleMessage: ApprovalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'nicole',
        content: nicoleResponse.message,
        timestamp: new Date().toISOString(),
        metadata: nicoleResponse.metadata
      };

      setMessages(prev => [...prev, nicoleMessage]);

      // Check if Nicole's response includes approval actions
      if (nicoleResponse.actions) {
        handleNicoleActions(nicoleResponse.actions);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      const errorMessage: ApprovalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'nicole',
        content: 'I apologize, but I encountered an error. You can still approve or reject the gifts using the buttons below.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNicoleActions = (actions: string[]) => {
    // Handle Nicole's suggested actions (approve, reject, modify)
    if (actions.includes('suggest_approval')) {
      // Add approval suggestion to UI
    }
  };

  const handleApproval = async (approvalDecision: 'approve' | 'reject') => {
    try {
      setIsLoading(true);
      setDecision(approvalDecision);

      const result = await enhancedAutoGiftingService.processNicoleApproval(
        conversationId,
        approvalDecision
      );

      if (result.success) {
        setConversationStatus('completed');
        
        const completionMessage: ApprovalMessage = {
          id: Date.now().toString(),
          role: 'nicole',
          content: approvalDecision === 'approve' 
            ? '🎉 Perfect! Your gifts have been approved and are being processed. The recipient will receive them soon!'
            : '👍 Understood. The auto-gift has been cancelled. No charges will be made.',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, completionMessage]);
        
        toast.success(
          approvalDecision === 'approve' 
            ? 'Gifts approved successfully!' 
            : 'Auto-gift cancelled'
        );

        // Notify parent component
        onApprovalComplete(approvalDecision, 'nicole_chat');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Chat with Nicole
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Auto-Gift Approval
          </Badge>
        </div>
        
        {/* Gift Summary */}
        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="font-medium">{eventDetails.event_type}</span>
            <Badge variant="secondary">${totalAmount}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedProducts.length} gift{selectedProducts.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'nicole' && (
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback className="text-primary-foreground text-xs">
                    N
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 bg-secondary">
                  <AvatarFallback className="text-secondary-foreground text-xs">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-primary">
                <AvatarFallback className="text-primary-foreground text-xs">
                  N
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <Separator />

        {/* Action Buttons */}
        {conversationStatus === 'active' && !decision && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => handleApproval('approve')}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Gifts
              </Button>
              <Button
                onClick={() => handleApproval('reject')}
                variant="outline"
                disabled={isLoading}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        {conversationStatus === 'active' && !decision && (
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Nicole about the gifts or request changes..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, or use the buttons above to approve/cancel
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NicoleApprovalInterface;