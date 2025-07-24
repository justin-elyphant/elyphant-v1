import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
interface GroupChatMember {
  id: string;
  user_id: string;
  profile?: { name: string; profile_image?: string };
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionedUsersChange: (userIds: string[]) => void;
  members: GroupChatMember[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MentionInput = ({ 
  value, 
  onChange, 
  onMentionedUsersChange, 
  members, 
  placeholder,
  disabled,
  className 
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredMembers = members.filter(member => 
    member.profile?.name?.toLowerCase().includes(suggestionSearch.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursor);

    // Check for @mention trigger
    const textBeforeCursor = newValue.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setSuggestionSearch(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestionSearch('');
    }

    // Extract mentioned user IDs from the text
    const mentionMatches = newValue.match(/@\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const mentionedUserIds = mentionMatches.map(match => {
      const idMatch = match.match(/@\[[^\]]+\]\(([^)]+)\)/);
      return idMatch ? idMatch[1] : '';
    }).filter(Boolean);
    
    onMentionedUsersChange(mentionedUserIds);
  };

  const insertMention = (member: GroupChatMember) => {
    if (!member.profile?.name || !inputRef.current) return;

    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    // Find the @mention pattern to replace
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (!mentionMatch) return;

    const beforeMention = textBeforeCursor.slice(0, -mentionMatch[0].length);
    const mentionText = `@[${member.profile.name}](${member.user_id})`;
    const newValue = beforeMention + mentionText + ' ' + textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestionSearch('');

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPos = beforeMention.length + mentionText.length + 1;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      inputRef.current?.focus();
    }, 0);
  };

  const displayValue = value.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      
      {showSuggestions && filteredMembers.length > 0 && (
        <Card className="absolute bottom-full mb-2 w-full max-w-sm z-50">
          <CardContent className="p-2 max-h-40 overflow-y-auto">
            <div className="space-y-1">
              {filteredMembers.slice(0, 5).map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => insertMention(member)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.profile?.profile_image} alt={member.profile?.name} />
                    <AvatarFallback className="text-xs">
                      {member.profile?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{member.profile?.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MentionInput;