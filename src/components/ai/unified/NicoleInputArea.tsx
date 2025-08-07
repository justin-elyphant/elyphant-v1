
import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface NicoleInputAreaProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const NicoleInputArea: React.FC<NicoleInputAreaProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/10 p-4 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-b-3xl">
      <div className="flex gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-white/40 border-white/30 backdrop-blur-sm text-gray-800 placeholder:text-gray-600 rounded-full px-4 py-2 focus:bg-white/50 transition-all duration-200"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 backdrop-blur-sm text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
