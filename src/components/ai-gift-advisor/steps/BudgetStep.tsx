import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DollarSign } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type BudgetStepProps = ReturnType<typeof useGiftAdvisorBot>;

const BudgetStep = ({ setBudget }: BudgetStepProps) => {
  const [budgetRange, setBudgetRange] = useState([25, 100]);

  const handleContinue = () => {
    setBudget({
      min: budgetRange[0],
      max: budgetRange[1]
    });
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Perfect! What's your budget?</h3>
        <p className="text-sm text-gray-600">
          I'll find amazing options that fit your budget and the occasion.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg font-semibold text-gray-900">
              ${budgetRange[0]} - ${budgetRange[1]}
            </span>
          </div>
          
          <div className="px-2">
            <Slider
              value={budgetRange}
              onValueChange={setBudgetRange}
              max={500}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>$5</span>
              <span>$500+</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { min: 10, max: 25, label: "Under $25" },
            { min: 25, max: 50, label: "$25 - $50" },
            { min: 50, max: 100, label: "$50 - $100" },
            { min: 100, max: 250, label: "$100 - $250" }
          ].map((preset) => (
            <Button
              key={`${preset.min}-${preset.max}`}
              variant="outline"
              size="sm"
              onClick={() => setBudgetRange([preset.min, preset.max])}
              className="text-xs hover:bg-purple-50 hover:border-purple-300"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            💡 I'll show you the best value options and premium choices within your range!
          </p>
        </div>
      </div>

      <div className="flex-1"></div>

      <Button 
        onClick={handleContinue}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        Find Perfect Gifts!
      </Button>
    </div>
  );
};

export default BudgetStep;
