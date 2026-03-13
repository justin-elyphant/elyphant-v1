import React, { useMemo, useState } from "react";
import StepLayout from "../StepLayout";
import { INTEREST_CATEGORIES } from "@/constants/commonInterests";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const displayedInterests = useMemo(() => {
    if (!search.trim()) return POPULAR_INTERESTS;
    const q = search.toLowerCase();
    // Search all categories
    const all = Object.values(INTEREST_CATEGORIES).flat();
    const unique = [...new Set(all)];
    return unique.filter((i) => i.toLowerCase().includes(q));
  }, [search]);

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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search interests & brands..."
          className="h-11 pl-9 text-base rounded-lg"
        />
      </div>

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
        {displayedInterests.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No matches found. Try a different search.
          </p>
        )}
      </div>
    </StepLayout>
  );
};

export default InterestsStep;
