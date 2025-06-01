
import React from "react";
import { Sparkles } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  isFromNicole: boolean;
  isTyping?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isFromNicole, 
  isTyping = false 
}) => {
  return (
    <div className={`flex ${isFromNicole ? 'justify-start' : 'justify-end'} mb-3`}>
      {isFromNicole && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
          isFromNicole
            ? 'bg-gray-100 text-gray-800'
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
        }`}
      >
        {isTyping ? (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : (
          <p className="text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
