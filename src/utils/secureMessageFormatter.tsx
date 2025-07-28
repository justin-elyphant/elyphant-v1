import React from 'react';
import DOMPurify from 'dompurify';

interface MentionProps {
  userName: string;
  userId: string;
}

const Mention: React.FC<MentionProps> = ({ userName }) => (
  <span className="bg-primary/20 text-primary px-1 rounded text-sm font-medium">
    @{userName}
  </span>
);

export const parseMessageContent = (content: string): React.ReactNode[] => {
  // Sanitize the content first
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // Parse mentions safely
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(sanitizedContent)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      const textBefore = sanitizedContent.slice(lastIndex, match.index);
      if (textBefore) {
        parts.push(textBefore);
      }
    }

    // Add mention component
    const userName = match[1];
    const userId = match[2];
    parts.push(
      <Mention 
        key={`mention-${match.index}`} 
        userName={userName} 
        userId={userId} 
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < sanitizedContent.length) {
    const remainingText = sanitizedContent.slice(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  return parts.length > 0 ? parts : [sanitizedContent];
};

export const SecureMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const parsedContent = parseMessageContent(content);
  
  return (
    <div className="text-sm leading-relaxed">
      {parsedContent.map((part, index) => (
        <React.Fragment key={index}>{part}</React.Fragment>
      ))}
    </div>
  );
};