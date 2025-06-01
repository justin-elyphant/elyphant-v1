
import React from "react";
import { Button } from "@/components/ui/button";

interface QuickResponseButtonsProps {
  options: string[];
  onSelect: (option: string) => void;
}

const QuickResponseButtons: React.FC<QuickResponseButtonsProps> = ({
  options,
  onSelect
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-3 ml-11">
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(option)}
          className="rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50 text-sm"
        >
          {option}
        </Button>
      ))}
    </div>
  );
};

export default QuickResponseButtons;
