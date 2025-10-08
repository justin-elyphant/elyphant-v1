
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePricingSettings } from "@/hooks/usePricingSettings";

const PricingControlsCard = () => {
  const { settings, loading, updateSetting, getDefaultGiftingFee } = usePricingSettings();
  const [markupPercentage, setMarkupPercentage] = useState(10);
  const [zincFee, setZincFee] = useState(1.00);
  const [feeDisplayName, setFeeDisplayName] = useState("Elyphant Gifting Fee");
  const [feeDescription, setFeeDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const defaultFee = getDefaultGiftingFee();
    if (defaultFee) {
      setMarkupPercentage(defaultFee.markup_percentage);
      setZincFee(defaultFee.zinc_per_order_fee || 1.00);
      setFeeDisplayName(defaultFee.fee_display_name);
      setFeeDescription(defaultFee.fee_description || "");
      setIsActive(defaultFee.is_active);
    }
  }, [settings]);
  
  const handleSaveSettings = async () => {
    const defaultFee = getDefaultGiftingFee();
    if (!defaultFee) {
      toast.error("Default fee setting not found");
      return;
    }

    setIsUpdating(true);
    
    try {
      const success = await updateSetting(defaultFee.id, {
        markup_percentage: markupPercentage,
        zinc_per_order_fee: zincFee,
        fee_display_name: feeDisplayName,
        fee_description: feeDescription,
        is_active: isActive
      });

      if (success) {
        toast.success("Pricing settings updated", {
          description: "Your pricing settings have been saved successfully."
        });
      }
    } catch (error) {
      console.error("Error saving pricing settings:", error);
      toast.error("Failed to update pricing settings", {
        description: "Please try again or contact support."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading pricing settings...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transparent Pricing Controls</CardTitle>
        <CardDescription>
          Configure transparent fee structure shown to customers at checkout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable transparent pricing</Label>
            <p className="text-sm text-muted-foreground">
              Show itemized fee breakdown at checkout
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fee-name">Fee Display Name</Label>
          <Input
            id="fee-name"
            value={feeDisplayName}
            onChange={(e) => setFeeDisplayName(e.target.value)}
            placeholder="e.g., Gifting Fee, Service Fee"
            disabled={!isActive}
          />
          <p className="text-xs text-muted-foreground">
            This is how the fee will appear to customers
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fee-description">Fee Description</Label>
          <Textarea
            id="fee-description"
            value={feeDescription}
            onChange={(e) => setFeeDescription(e.target.value)}
            placeholder="Explain what this fee covers..."
            disabled={!isActive}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This explanation will be shown when customers click the info icon
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="markup-percentage">Fee Percentage (%)</Label>
          <Input
            id="markup-percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={markupPercentage}
            onChange={(e) => setMarkupPercentage(Number(e.target.value))}
            disabled={!isActive}
            className="max-w-[180px]"
          />
          <p className="text-xs text-muted-foreground">
            Percentage markup on product cost
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zinc-fee">Zinc Fulfillment Fee (per order)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <Input
              id="zinc-fee"
              type="number"
              min="0"
              step="0.01"
              value={zincFee}
              onChange={(e) => setZincFee(Number(e.target.value))}
              disabled={!isActive}
              className="max-w-[180px]"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Zinc's per-order fulfillment cost (adjust when rates change)
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Product Cost</span>
              <span>$10.00</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>$6.99</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                {feeDisplayName}
                <span className="text-xs text-muted-foreground">ℹ️</span>
              </span>
              <div className="text-right">
                <div>${((10 * markupPercentage) / 100 + zincFee).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  ({markupPercentage}% + ${zincFee.toFixed(2)} fulfillment)
                </div>
              </div>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${(10 + 6.99 + (10 * markupPercentage) / 100 + zincFee).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSaveSettings} 
          disabled={isUpdating || !isActive}
          className="mt-4"
        >
          {isUpdating ? "Updating..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingControlsCard;
