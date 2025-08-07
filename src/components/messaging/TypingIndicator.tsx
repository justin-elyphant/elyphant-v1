
import React from "react";

interface TypingIndicatorProps {
  userName: string;
}

const TypingIndicator = ({ userName }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{userName} is typing</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s',
              animationIterationCount: 'infinite'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
