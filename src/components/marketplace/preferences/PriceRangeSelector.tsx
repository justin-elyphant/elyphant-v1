
import React from "react";
import { Slider } from "@/components/ui/slider";

interface PriceRangeSelectorProps {
  min: number;
  max: number;
  onChange: (range: [number, number]) => void;
}

const PriceRangeSelector = ({ min, max, onChange }: PriceRangeSelectorProps) => {
  // Set max to 500
  const MAX_PRICE = 500;
  const handlePriceRangeChange = (values: number[]) => {
    onChange([values[0], values[1]]);
  };
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Preferred Price Range</h3>
      <div className="px-3">
        <Slider 
          defaultValue={[min, MAX_PRICE]} 
          max={MAX_PRICE}
          step={10}
          onValueChange={handlePriceRangeChange}
          className="my-6"
        />
        <div className="flex justify-between text-sm">
          <div>${min}</div>
          <div>{max === MAX_PRICE ? "$500+" : `$${max}`}</div>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSelector;

