import React, { useMemo, useState } from "react";
import StepLayout from "../StepLayout";
import { INTEREST_CATEGORIES } from "@/constants/commonInterests";
import { Search, Plus, X, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InterestsStepProps {
  interests: string[];
  onChange: (interests: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

// Curated popular interests for the default view
const POPULAR_INTERESTS = [
  "Travel", "Cooking", "Fitness", "Reading", "Gaming",
  "Photography", "Music", "Fashion", "Hiking", "Movies",
  "Coffee", "Yoga", "Art", "Technology", "Gardening",
  "Running", "Baking", "Podcasts", "Wine Tasting", "Skincare",
  "Nike", "Apple", "Lululemon", "PlayStation", "IKEA",
  "Le Creuset", "Dyson", "Patagonia", "Sephora", "Yeti",
];

const InterestsStep: React.FC<InterestsStepProps> = ({
  interests,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}) => {
  const [search, setSearch] = useState("");

  const toggle = (interest: string) => {
    if (interests.includes(interest)) {
      onChange(interests.filter((i) => i !== interest));
    } else {
      onChange([...interests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmed = search.trim();
    if (trimmed && !interests.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...interests, trimmed]);
      setSearch("");
    }
  };

  const displayedInterests = useMemo(() => {
    if (!search.trim()) return POPULAR_INTERESTS;
    const q = search.toLowerCase();
    const all = Object.values(INTEREST_CATEGORIES).flat();
    const unique = [...new Set(all)];
    return unique.filter((i) => i.toLowerCase().includes(q));
  }, [search]);

  const showAddCustom = search.trim() && !displayedInterests.some(
    i => i.toLowerCase() === search.trim().toLowerCase()
  ) && !interests.some(i => i.toLowerCase() === search.trim().toLowerCase());

  // Custom interests that aren't in the popular list
  const customInterests = interests.filter(
    i => !POPULAR_INTERESTS.includes(i) && !displayedInterests.includes(i)
  );

  return (
    <StepLayout
      heading="What are you into?"
      subtitle="Pick a few so we can personalize gift ideas. Select at least 3."
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={interests.length < 3}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      {/* Hint */}
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Don't see what you're looking for? Type anything — teams, brands, hobbies — and press Enter to add it.
        </p>
      </div>

      {/* Search / free-form input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && showAddCustom) {
              e.preventDefault();
              addCustomInterest();
            }
          }}
          placeholder="Search or type your own interest..."
          className="h-11 pl-9 pr-20 text-base rounded-lg"
        />
        {showAddCustom && (
          <Button
            type="button"
            size="sm"
            onClick={addCustomInterest}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Custom interests the user added */}
      {customInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customInterests.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className="px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-manipulation bg-primary text-primary-foreground flex items-center gap-1.5"
            >
              {interest}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      {/* Chip grid */}
      <div className="flex flex-wrap gap-2 pb-20 md:pb-0">
        {displayedInterests.map((interest) => {
          const selected = interests.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggle(interest)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all touch-manipulation
                ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
            >
              {interest}
            </button>
          );
        })}
        {displayedInterests.length === 0 && !showAddCustom && (
          <p className="text-sm text-muted-foreground py-4">
            No matches found. Try a different search.
          </p>
        )}
        {displayedInterests.length === 0 && showAddCustom && (
          <p className="text-sm text-muted-foreground py-4">
            No matches — press <span className="font-medium text-foreground">Enter</span> or tap <span className="font-medium text-foreground">Add</span> to add "<span className="font-medium text-foreground">{search.trim()}</span>" as a custom interest.
          </p>
        )}
      </div>
    </StepLayout>
  );
};

export default InterestsStep;
