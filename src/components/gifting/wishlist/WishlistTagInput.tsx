
import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { normalizeTags } from "@/lib/utils";

interface WishlistTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

const WishlistTagInput = ({
  tags,
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
  disabled = false
}: WishlistTagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the input when clicking on the container
  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle key events (Enter and Backspace)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    // Add tag on Enter or comma
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      
      const normalizedTag = inputValue.trim().toLowerCase();
      if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
        onChange([...tags, normalizedTag]);
      }
      
      setInputValue("");
    }
    
    // Remove the last tag on Backspace if input is empty
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  // Remove a specific tag
  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  // Automatically resize the input to fit content
  useEffect(() => {
    if (inputRef.current && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const minWidth = Math.min(100, containerWidth - 20); // 20px for padding
      const width = Math.max(
        minWidth,
        Math.min(containerWidth - 20, inputValue.length * 8)
      );
      inputRef.current.style.width = `${width}px`;
    }
  }, [inputValue]);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-[42px] ${
        disabled ? "bg-gray-50 cursor-not-allowed" : "bg-background cursor-text"
      }`}
      onClick={handleContainerClick}
    >
      {tags.map((tag, index) => (
        <Badge 
          key={index} 
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 text-xs"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          )}
        </Badge>
      ))}
      
      {tags.length < maxTags && !disabled && (
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="border-none p-0 h-auto min-w-[60px] focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}
      
      {tags.length === maxTags && (
        <span className="text-xs text-muted-foreground ml-1">
          Maximum {maxTags} tags reached
        </span>
      )}
    </div>
  );
};

export default WishlistTagInput;
