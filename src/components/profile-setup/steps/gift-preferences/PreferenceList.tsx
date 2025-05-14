
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiftPreference } from "@/types/profile";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreferenceListProps {
  preferences: GiftPreference[];
  onRemovePreference: (index: number) => void;
  onUpdateImportance: (index: number, importance: "low" | "medium" | "high") => void;
}

const PreferenceList: React.FC<PreferenceListProps> = ({
  preferences,
  onRemovePreference,
  onUpdateImportance,
}) => {
  // If no preferences, show empty state
  if (preferences.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No preferences added yet. Add some categories above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Your Gift Preferences</h3>
      
      <div className="flex flex-wrap gap-2">
        {preferences.map((preference, index) => (
          <div key={index} className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                "pl-2 pr-1 py-1 flex items-center gap-1",
                preference.importance === "high" && "bg-primary/10 text-primary",
                preference.importance === "medium" && "bg-orange-50 text-orange-600",
                preference.importance === "low" && "bg-slate-50 text-slate-600"
              )}
            >
              <span>{preference.category}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 rounded-full hover:bg-background/80"
                onClick={() => onRemovePreference(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
            
            <div className="flex border rounded-md overflow-hidden text-[10px]">
              <button
                onClick={() => onUpdateImportance(index, "low")}
                className={cn(
                  "px-1.5 py-0.5",
                  preference.importance === "low" ? "bg-slate-100 text-slate-800" : "bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                Low
              </button>
              <button
                onClick={() => onUpdateImportance(index, "medium")}
                className={cn(
                  "px-1.5 py-0.5",
                  preference.importance === "medium" ? "bg-orange-100 text-orange-800" : "bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                Medium
              </button>
              <button
                onClick={() => onUpdateImportance(index, "high")}
                className={cn(
                  "px-1.5 py-0.5",
                  preference.importance === "high" ? "bg-primary/10 text-primary" : "bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                High
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PreferenceList;
