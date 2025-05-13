
import React from 'react';
import { CategoryImportance } from './utils';

export interface ImportanceSelectorProps {
  // The original component accepts level
  level?: string;
  // But might also accept selectedImportance
  selectedImportance?: CategoryImportance;
  label: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  // Might also accept onImportanceChange
  onImportanceChange?: React.Dispatch<React.SetStateAction<CategoryImportance>>;
}

const ImportanceSelector: React.FC<ImportanceSelectorProps> = ({
  level,
  selectedImportance,
  label,
  description,
  isSelected,
  onSelect
}) => {
  // Use either level or selectedImportance, whichever is provided
  const currentLevel = selectedImportance || level;
  
  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-foreground">{label}</h3>
        <div
          className={`h-3 w-3 rounded-full ${
            isSelected ? 'bg-primary' : 'bg-gray-200'
          }`}
        />
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default ImportanceSelector;
