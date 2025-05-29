
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useGiftAdvisorBot, RecipientType } from "../hooks/useGiftAdvisorBot";

type ManualInputStepProps = ReturnType<typeof useGiftAdvisorBot>;

const ageRanges = ["0-12", "13-17", "18-25", "26-35", "36-50", "51-65", "65+"];
const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];
const relationships: { value: RecipientType; label: string }[] = [
  { value: "friend", label: "Friend" },
  { value: "family", label: "Family" },
  { value: "coworker", label: "Coworker" },
  { value: "other", label: "Other" }
];
const commonInterests = [
  "Technology", "Books", "Sports", "Music", "Art", "Cooking", "Travel", 
  "Gaming", "Fashion", "Fitness", "Photography", "Movies", "Gardening"
];

const ManualInputStep = ({ setRecipientDetails }: ManualInputStepProps) => {
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [relationship, setRelationship] = useState<RecipientType>("friend");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const handleCustomInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  const handleContinue = () => {
    if (!name.trim() || !ageRange || !gender || selectedInterests.length === 0) {
      return;
    }

    setRecipientDetails({
      name: name.trim(),
      ageRange,
      gender,
      relationship,
      interests: selectedInterests
    });
  };

  // Create a combined list of all interests to display
  const allInterestsToDisplay = [
    ...commonInterests,
    ...selectedInterests.filter(interest => !commonInterests.includes(interest))
  ];

  const isValid = name.trim() && ageRange && gender && selectedInterests.length > 0;

  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-y-auto">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold mb-1">Tell me about them</h3>
        <p className="text-sm text-gray-600">
          Help me understand who you're shopping for.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter their name"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Age Range</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {ageRanges.map((range) => (
              <Button
                key={range}
                variant={ageRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setAgeRange(range)}
                className="text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Gender</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {genders.map((g) => (
              <Button
                key={g}
                variant={gender === g ? "default" : "outline"}
                size="sm"
                onClick={() => setGender(g)}
                className="text-xs"
              >
                {g}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Relationship</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {relationships.map((rel) => (
              <Button
                key={rel.value}
                variant={relationship === rel.value ? "default" : "outline"}
                size="sm"
                onClick={() => setRelationship(rel.value)}
                className="text-xs"
              >
                {rel.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Interests (select at least one)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {allInterestsToDisplay.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Badge
                  key={interest}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:bg-purple-100 text-xs px-2 py-1"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
          
          {/* Custom Interest Input */}
          <div className="flex gap-2 mt-3">
            <Input
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyPress={handleCustomInterestKeyPress}
              placeholder="Search golf or brand names like Nike"
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomInterest}
              disabled={!customInterest.trim()}
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1"></div>

      <Button 
        onClick={handleContinue}
        disabled={!isValid}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
      >
        Continue
      </Button>
    </div>
  );
};

export default ManualInputStep;
