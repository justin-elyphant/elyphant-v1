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
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="item-aligned" side="bottom" sideOffset={8}>
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
