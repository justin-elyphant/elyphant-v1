
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface GiftOptions {
  isGift: boolean;
  recipientName: string;
  giftMessage: string;
  giftWrapping: boolean;
}

interface GiftOptionsFormProps {
  giftOptions: GiftOptions;
  onUpdate: (data: Partial<GiftOptions>) => void;
}

const GiftOptionsForm: React.FC<GiftOptionsFormProps> = ({ giftOptions, onUpdate }) => {
  const handleChange = (field: keyof GiftOptions, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Gift Options</h3>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isGift">This order is a gift</Label>
            <p className="text-sm text-muted-foreground">
              Add gift options like message and gift wrapping
            </p>
          </div>
          <Switch 
            id="isGift"
            checked={giftOptions.isGift}
            onCheckedChange={(checked) => handleChange("isGift", checked)}
          />
        </div>
        
        {giftOptions.isGift && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input 
                id="recipientName"
                value={giftOptions.recipientName}
                onChange={(e) => handleChange("recipientName", e.target.value)}
                placeholder="Enter recipient's name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="giftMessage">Gift Message</Label>
              <Textarea 
                id="giftMessage"
                value={giftOptions.giftMessage}
                onChange={(e) => handleChange("giftMessage", e.target.value)}
                placeholder="Add a personal message to your gift (optional)"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {giftOptions.giftMessage.length}/200
              </p>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <Label>Gift Presentation</Label>
                <Switch 
                  checked={giftOptions.giftWrapping}
                  onCheckedChange={(checked) => handleChange("giftWrapping", checked)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className={cn(
                  "cursor-pointer transition-all",
                  !giftOptions.giftWrapping && "border-2 border-primary"
                )}>
                  <CardContent className="p-4 text-center">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-medium">Standard Packaging</p>
                    <p className="text-sm text-muted-foreground">Free</p>
                  </CardContent>
                </Card>
                
                <Card className={cn(
                  "cursor-pointer transition-all",
                  giftOptions.giftWrapping && "border-2 border-primary"
                )}>
                  <CardContent className="p-4 text-center">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                    <p className="font-medium">Gift Wrapping</p>
                    <p className="text-sm text-muted-foreground">$4.99</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftOptionsForm;
