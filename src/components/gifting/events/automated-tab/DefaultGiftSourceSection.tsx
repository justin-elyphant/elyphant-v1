
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, List, Package } from "lucide-react";
import { UnifiedGiftSettings } from "@/services/UnifiedGiftManagementService";

interface DefaultGiftSourceSectionProps {
  settings: UnifiedGiftSettings | null;
  onUpdateSettings: (updates: Partial<UnifiedGiftSettings>) => void;
}

const DefaultGiftSourceSection = ({ settings, onUpdateSettings }: DefaultGiftSourceSectionProps) => {
  const [giftSource, setGiftSource] = useState(settings?.default_gift_source || "wishlist");

  const handleSave = () => {
    onUpdateSettings({
      default_gift_source: giftSource as "wishlist" | "ai" | "both" | "specific"
    });
  };

  const handleGiftSourceChange = (value: string) => {
    setGiftSource(value as "wishlist" | "ai" | "both" | "specific");
  };

  const sourceOptions = [
    {
      value: "wishlist",
      label: "From Wishlist",
      description: "Select gifts from the recipient's wishlist",
      icon: List
    },
    {
      value: "ai",
      label: "AI Recommendations",
      description: "Let AI suggest personalized gifts based on preferences",
      icon: Sparkles
    },
    {
      value: "both",
      label: "Wishlist + AI",
      description: "Combine wishlist items with AI suggestions",
      icon: Gift
    },
    {
      value: "specific",
      label: "Specific Product",
      description: "Choose a specific product for each occasion",
      icon: Package
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Default Gift Source</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Choose how gifts should be selected by default for new auto-gifting rules
        </p>
      </div>

      <RadioGroup value={giftSource} onValueChange={handleGiftSourceChange}>
        <div className="space-y-3">
          {sourceOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={option.value} className="flex items-center text-sm font-medium cursor-pointer">
                    <IconComponent className="h-4 w-4 mr-2" />
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Default Source
        </Button>
      </div>
    </div>
  );
};

export default DefaultGiftSourceSection;
