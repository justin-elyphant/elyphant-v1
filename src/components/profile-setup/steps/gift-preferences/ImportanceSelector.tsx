
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryImportance } from './utils';

export interface ImportanceSelectorProps {
  value: CategoryImportance;
  onChange: (value: CategoryImportance) => void;
}

const ImportanceSelector: React.FC<ImportanceSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="ml-2">
      <Select 
        value={value} 
        onValueChange={(v) => onChange(v as CategoryImportance)}
      >
        <SelectTrigger className="w-[100px] h-7 text-xs">
          <SelectValue placeholder="Importance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ImportanceSelector;
