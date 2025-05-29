
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Gift } from "lucide-react";
import { GiftSource } from "./types";

interface AutoGiftSectionProps {
  autoGiftEnabled: boolean;
  autoGiftAmount: number;
  giftSource: GiftSource;
  setAutoGiftEnabled: (enabled: boolean) => void;
  setAutoGiftAmount: (amount: number) => void;
  setGiftSource: (source: GiftSource) => void;
  validationErrors?: Record<string, string>;
}

const AutoGiftSection = ({
  autoGiftEnabled,
  autoGiftAmount,
  giftSource,
  setAutoGiftEnabled,
  setAutoGiftAmount,
  setGiftSource,
  validationErrors = {},
}: AutoGiftSectionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="flex items-center text-sm font-medium">
            <Gift className="h-4 w-4 mr-1.5" />
            Auto-Gifting
          </Label>
          <p className="text-xs text-muted-foreground">
            Automatically send a gift on this date
          </p>
        </div>
        <Switch
          checked={autoGiftEnabled}
          onCheckedChange={setAutoGiftEnabled}
        />
      </div>
      
      {autoGiftEnabled && (
        <div className="space-y-3 pl-6">
          <div className="space-y-1">
            <Label htmlFor="gift-amount" className="flex items-center text-sm font-medium">
              <DollarSign className="h-4 w-4 mr-1.5" />
              Gift Budget
            </Label>
            <Input
              id="gift-amount"
              type="number"
              value={autoGiftAmount}
              onChange={(e) => setAutoGiftAmount(parseInt(e.target.value) || 0)}
              placeholder="50"
              min="1"
              className={`h-9 ${validationErrors.autoGiftAmount ? 'border-red-500' : ''}`}
            />
            {validationErrors.autoGiftAmount && (
              <p className="text-sm text-red-500">{validationErrors.autoGiftAmount}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm font-medium">Gift Source</Label>
            <Select value={giftSource} onValueChange={(value: GiftSource) => setGiftSource(value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wishlist">From Wishlist</SelectItem>
                <SelectItem value="ai">AI Recommendation</SelectItem>
                <SelectItem value="both">Wishlist + AI</SelectItem>
                <SelectItem value="specific">Specific Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoGiftSection;
