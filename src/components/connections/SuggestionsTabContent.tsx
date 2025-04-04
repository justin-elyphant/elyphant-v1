
import React from "react";
import { Connection } from "@/types/connections";
import SuggestionCard from "./SuggestionCard";

interface SuggestionsTabContentProps {
  suggestions: Connection[];
}

const SuggestionsTabContent: React.FC<SuggestionsTabContentProps> = ({ suggestions }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {suggestions.map(suggestion => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
};

export default SuggestionsTabContent;
