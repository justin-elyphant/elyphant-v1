
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Minus } from "lucide-react";

interface GiftAmountInputProps {
  amount: number;
  setAmount: (value: number) => void;
}

const GiftAmountInput = ({ amount, setAmount }: GiftAmountInputProps) => {
  // Function to increment the gift amount
  const incrementAmount = () => {
    setAmount(Math.min(amount + 5, 500)); // Cap at $500
  };

  // Function to decrement the gift amount
  const decrementAmount = () => {
    setAmount(Math.max(amount - 5, 0)); // Minimum $0
  };

  // Handle direct input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      // Ensure the value is between 0 and 500
      setAmount(Math.min(Math.max(value, 0), 500));
    }
  };

  return (
    <div className="space-y-0 mt-0">
      <Label htmlFor="gift-amount" className="flex items-center text-[7px] font-medium leading-none">
        <DollarSign className="h-1.5 w-1.5 mr-0.5 text-primary" />
        Gift Amount
      </Label>
      <div className="flex items-center space-x-0.5 mt-0.5">
        <Button 
          variant="outline" 
          size="icon" 
          type="button" 
          onClick={decrementAmount}
          className="h-3 w-3 border-primary/20 text-primary p-0"
        >
          <Minus className="h-1.5 w-1.5" />
        </Button>
        <div className="relative flex-1">
          <DollarSign className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 text-muted-foreground" />
          <Input
            id="gift-amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="pl-3 text-center focus-visible:ring-primary/50 border-primary/20 h-3 text-[7px] py-0"
            min={0}
            max={500}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          type="button" 
          onClick={incrementAmount}
          className="h-3 w-3 border-primary/20 text-primary p-0"
        >
          <Plus className="h-1.5 w-1.5" />
        </Button>
      </div>
    </div>
  );
};

export default GiftAmountInput;
