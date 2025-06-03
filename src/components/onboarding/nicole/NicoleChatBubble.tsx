
import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface NicoleChatBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  };
  isLoading?: boolean;
}

const NicoleChatBubble: React.FC<NicoleChatBubbleProps> = ({ 
  message, 
  isLoading = false 
}) => {
  const isNicole = message.role === 'assistant';
  
  return (
    <div className={`flex ${isNicole ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isNicole ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        {isNicole && (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl relative
            ${isNicole 
              ? 'bg-gray-100 text-gray-900 rounded-bl-sm' 
              : 'bg-purple-600 text-white rounded-br-sm'
            }
            shadow-sm
          `}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
          
          {/* iOS-style message tail */}
          <div
            className={`
              absolute top-0 w-3 h-3
              ${isNicole 
                ? 'left-0 -ml-1 bg-gray-100' 
                : 'right-0 -mr-1 bg-purple-600'
              }
              transform rotate-45
            `}
            style={{
              clipPath: isNicole 
                ? 'polygon(0 0, 100% 100%, 0 100%)' 
                : 'polygon(100% 0, 100% 100%, 0 0)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NicoleChatBubble;
