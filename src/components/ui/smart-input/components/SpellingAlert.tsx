import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface SpellingAlertProps {
  showSpellingAlert: boolean;
  spellingSuggestion: string | null;
  onUseCorrection: () => void;
  onIgnore: () => void;
}

export const SpellingAlert: React.FC<SpellingAlertProps> = ({
  showSpellingAlert,
  spellingSuggestion,
  onUseCorrection,
  onIgnore
}) => {
  if (!showSpellingAlert || !spellingSuggestion) {
    return null;
  }

  return (
    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-orange-700">
          <Lightbulb className="h-4 w-4" />
          <span>Did you mean "{spellingSuggestion}"?</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onUseCorrection}
            className="h-6 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            Use suggestion
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onIgnore}
            className="h-6 px-2 text-xs text-orange-600 hover:bg-orange-100"
          >
            Ignore
          </Button>
        </div>
      </div>
    </div>
  );
};