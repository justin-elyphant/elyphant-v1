import React, { useRef, useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RELATIONSHIP_CATEGORIES } from '@/config/relationshipTypes';
import { RelationshipType } from '@/types/connections';

interface RelationshipSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const RelationshipSelector: React.FC<RelationshipSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select relationship",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Scroll to top when opening
      setTimeout(() => {
        const viewport = document.querySelector('[role="listbox"]');
        if (viewport) {
          viewport.scrollTop = 0;
        }
      }, 0);
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} open={isOpen} onOpenChange={handleOpenChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[400px]" position="popper" side="bottom" align="start" sideOffset={6} avoidCollisions={false}>
        {Object.entries(RELATIONSHIP_CATEGORIES).map(([categoryKey, category]) => (
          <SelectGroup key={categoryKey}>
            <SelectLabel>{category.label}</SelectLabel>
            {category.types.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <span className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RelationshipSelector;
