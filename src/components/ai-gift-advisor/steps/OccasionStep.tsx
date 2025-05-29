
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Gift, Heart, GraduationCap, Baby } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type OccasionStepProps = ReturnType<typeof useGiftAdvisorBot>;

const occasions = [
  { value: "birthday", label: "Birthday", icon: Gift },
  { value: "anniversary", label: "Anniversary", icon: Heart },
  { value: "graduation", label: "Graduation", icon: GraduationCap },
  { value: "baby shower", label: "Baby Shower", icon: Baby },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "holiday", label: "Holiday", icon: Gift },
  { value: "just because", label: "Just Because", icon: Heart },
  { value: "other", label: "Other", icon: Calendar }
];

const OccasionStep = ({ setOccasion }: OccasionStepProps) => {
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");

  console.log("Selected occasion:", selectedOccasion);
  console.log("Custom occasion:", customOccasion);

  const handleContinue = () => {
    const occasion = selectedOccasion === "other" ? customOccasion : selectedOccasion;
    console.log("Continuing with occasion:", occasion);
    if (occasion.trim()) {
      setOccasion(occasion);
    }
  };

  const handleOccasionSelect = (value: string) => {
    console.log("Selecting occasion:", value);
    setSelectedOccasion(value);
  };

  const isValid = selectedOccasion && (selectedOccasion !== "other" || customOccasion.trim());
  console.log("Is valid:", isValid);

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">What's the occasion?</h3>
        <p className="text-sm text-gray-600">
          This helps me suggest more relevant gifts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {occasions.map((occasion) => {
          const Icon = occasion.icon;
          const isSelected = selectedOccasion === occasion.value;
          
          return (
            <Button
              key={occasion.value}
              variant={isSelected ? "default" : "outline"}
              className={`h-16 flex flex-col items-center justify-center gap-1 text-xs hover:bg-purple-50 hover:border-purple-300 ${
                isSelected ? "bg-purple-600 text-white hover:bg-purple-700" : ""
              }`}
              onClick={() => handleOccasionSelect(occasion.value)}
            >
              <Icon className="h-4 w-4" />
              <span>{occasion.label}</span>
            </Button>
          );
        })}
      </div>

      {selectedOccasion === "other" && (
        <div className="space-y-2">
          <Label htmlFor="custom-occasion" className="text-sm font-medium">
            Custom Occasion
          </Label>
          <Input
            id="custom-occasion"
            value={customOccasion}
            onChange={(e) => setCustomOccasion(e.target.value)}
            placeholder="Enter the occasion"
          />
        </div>
      )}

      <div className="flex-1"></div>

      <Button 
        onClick={handleContinue}
        disabled={!isValid}
        className={`w-full ${
          isValid 
            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
            : "bg-gray-300 cursor-not-allowed opacity-50"
        }`}
      >
        Continue
      </Button>
    </div>
  );
};

export default OccasionStep;
