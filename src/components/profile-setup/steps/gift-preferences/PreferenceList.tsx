
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { GiftPreference } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { valueToImportance } from "./utils";

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
  const getImportanceBadgeStyle = (importance: number) => {
    const importanceLevel = valueToImportance(importance);
    
    switch (importanceLevel) {
      case "high":
        return "bg-red-100 text-red-700 hover:bg-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 hover:bg-amber-200";
      case "low":
      default:
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
    }
  };

  if (!preferences || preferences.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
        No gift preferences added yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Your Gift Preferences</h3>
      <ul className="space-y-2">
        {preferences.map((preference, index) => (
          <li 
            key={`${preference.category}-${index}`} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
          >
            <div className="flex items-center gap-2">
              <span>{preference.category}</span>
              <Badge className={getImportanceBadgeStyle(preference.importance)}>
                {valueToImportance(preference.importance)}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PreferenceList;
