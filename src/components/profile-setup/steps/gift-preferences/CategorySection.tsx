
import React, { useState } from 'react';
import { CategoryImportance, valueToImportance } from './utils';
import ImportanceSelector from './ImportanceSelector';

export interface CategorySectionProps {
  categoryName: string;
  selectedImportance?: CategoryImportance;
  onImportanceChange: React.Dispatch<React.SetStateAction<CategoryImportance>>;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  categoryName,
  selectedImportance = 'medium',
  onImportanceChange,
  notes = '',
  onNotesChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">{categoryName}</h3>
      <p className="text-sm text-muted-foreground">
        Select how important this category is to you
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ImportanceSelector
          label="Low Priority"
          description="Occasionally interested in gifts from this category."
          isSelected={selectedImportance === 'low'}
          onSelect={() => onImportanceChange('low')}
        />
        
        <ImportanceSelector
          label="Medium Priority"
          description="Sometimes interested in gifts from this category."
          isSelected={selectedImportance === 'medium'}
          onSelect={() => onImportanceChange('medium')}
        />
        
        <ImportanceSelector
          label="High Priority"
          description="Very interested in gifts from this category."
          isSelected={selectedImportance === 'high'}
          onSelect={() => onImportanceChange('high')}
        />
      </div>
      
      {onNotesChange && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            className="w-full p-2 border rounded-md"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add specific preferences about this category..."
            rows={3}
          />
        </div>
      )}
    </div>
  );
};

export default CategorySection;
