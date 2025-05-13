
import React from 'react';
import { GiftPreference } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { numberToImportance } from './utils';

interface PreferenceListProps {
  preferences: GiftPreference[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, importance: "low" | "medium" | "high") => void;
}

const PreferenceList: React.FC<PreferenceListProps> = ({ 
  preferences, 
  onRemove, 
  onUpdate 
}) => {
  if (preferences.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-lg">
        <p className="text-muted-foreground">No gift preferences added yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add categories below to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {preferences.map((preference, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-3 border rounded-md"
        >
          <div className="flex-1">
            <p className="font-medium">{preference.category}</p>
            <div className="flex mt-1 space-x-2">
              <ImportanceButton 
                label="Low" 
                isActive={preference.importance === 1} 
                onClick={() => onUpdate(index, "low")}
              />
              <ImportanceButton 
                label="Medium" 
                isActive={preference.importance === 2}
                onClick={() => onUpdate(index, "medium")}
              />
              <ImportanceButton 
                label="High" 
                isActive={preference.importance === 3}
                onClick={() => onUpdate(index, "high")}
              />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

interface ImportanceButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ImportanceButton: React.FC<ImportanceButtonProps> = ({
  label,
  isActive,
  onClick
}) => {
  return (
    <button
      type="button"
      className={`px-2 py-1 rounded text-xs ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default PreferenceList;
