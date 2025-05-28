
import React from "react";

interface TypingIndicatorProps {
  userName: string;
}

const TypingIndicator = ({ userName }: TypingIndicatorProps) => {
  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg rounded-tl-none max-w-[80%]">
        <span className="text-sm text-muted-foreground">{userName} is typing</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
