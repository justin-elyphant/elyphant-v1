
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PricingControlsCard = () => {
  const [autoAdjustPricing, setAutoAdjustPricing] = useState(true);
  const [defaultPriceAdjustment, setDefaultPriceAdjustment] = useState(15);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleSaveSettings = async () => {
    setIsUpdating(true);
    
    try {
      // In a real implementation, this would save to a backend
      console.log("Saving pricing settings:", {
        autoAdjustPricing,
        defaultPriceAdjustment
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("Pricing settings updated", {
        description: "Your pricing settings have been saved successfully."
      });
    } catch (error) {
      console.error("Error saving pricing settings:", error);
      toast.error("Failed to update pricing settings", {
        description: "Please try again or contact support."
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Controls</CardTitle>
        <CardDescription>
          Configure how product prices are managed in the marketplace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-adjust pricing</Label>
            <p className="text-sm text-muted-foreground">
              Automatically adjust prices based on your default price adjustment
            </p>
          </div>
          <Switch
            checked={autoAdjustPricing}
            onCheckedChange={setAutoAdjustPricing}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="default-adjustment">Default price adjustment (%)</Label>
          <Input
            id="default-adjustment"
            type="number"
            min="0"
            max="100"
            value={defaultPriceAdjustment}
            onChange={(e) => setDefaultPriceAdjustment(Number(e.target.value))}
            disabled={!autoAdjustPricing}
            className="max-w-[180px]"
          />
          <p className="text-xs text-muted-foreground">
            This percentage will be added to the base cost of all products
          </p>
        </div>
        
        <Button 
          onClick={handleSaveSettings} 
          disabled={isUpdating}
          className="mt-4"
        >
          {isUpdating ? "Updating..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingControlsCard;
