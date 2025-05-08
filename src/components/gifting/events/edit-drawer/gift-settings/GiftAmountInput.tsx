
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";

interface GiftAmountInputProps {
  amount: number;
  setAmount: (value: number) => void;
}

const GiftAmountInput = ({ amount, setAmount }: GiftAmountInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="gift-amount">
        <DollarSign className="h-4 w-4 mr-2 inline-block" />
        Gift Amount
      </Label>
      <Input
        id="gift-amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Gift budget in dollars"
      />
    </div>
  );
};

export default GiftAmountInput;
