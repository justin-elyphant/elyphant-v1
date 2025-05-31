
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Gift, Calendar, Heart } from "lucide-react";
import { GiftOptions } from "./useCheckoutState";

interface GiftScheduleFormProps {
  giftOptions: GiftOptions;
  onUpdate: (options: Partial<GiftOptions>) => void;
}

const GiftScheduleForm: React.FC<GiftScheduleFormProps> = ({
  giftOptions,
  onUpdate
}) => {
  const handleGiftToggle = (checked: boolean) => {
    onUpdate({ 
      isGift: checked,
      giftMessage: checked ? giftOptions.giftMessage : "",
      isSurpriseGift: checked ? giftOptions.isSurpriseGift : false
    });
  };

  const handleMessageChange = (message: string) => {
    onUpdate({ giftMessage: message });
  };

  const handleDateChange = (date: string) => {
    onUpdate({ scheduledDeliveryDate: date });
  };

  const handleSurpriseToggle = (checked: boolean) => {
    onUpdate({ isSurpriseGift: checked });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isGift"
              checked={giftOptions.isGift}
              onCheckedChange={handleGiftToggle}
            />
            <Label htmlFor="isGift" className="cursor-pointer">
              This is a gift
            </Label>
          </div>

          {giftOptions.isGift && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div>
                <Label htmlFor="giftMessage">Gift Message (Optional)</Label>
                <Textarea
                  id="giftMessage"
                  placeholder="Write a personal message for the recipient..."
                  value={giftOptions.giftMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  className="mt-1"
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {giftOptions.giftMessage.length}/255 characters
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isSurprise"
                  checked={giftOptions.isSurpriseGift}
                  onCheckedChange={handleSurpriseToggle}
                />
                <Label htmlFor="isSurprise" className="cursor-pointer flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Keep this as a surprise (don't send confirmation emails to me)
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Delivery Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="deliveryDate">Preferred Delivery Date (Optional)</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={giftOptions.scheduledDeliveryDate || ""}
              onChange={(e) => handleDateChange(e.target.value)}
              className="mt-1"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Note: Actual delivery dates depend on shipping method and retailer availability
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftScheduleForm;
