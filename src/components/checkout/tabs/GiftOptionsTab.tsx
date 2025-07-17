import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Gift, Package, Eye, EyeOff, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EditFormData } from '../EnhancedDeliveryEditModal';

interface GiftOptionsTabProps {
  formData: EditFormData;
  setFormData: (data: EditFormData) => void;
  permissions: {
    canEditBasicInfo: boolean;
    canEditRelationship: boolean;
    canEditAddress: boolean;
    canEditGiftOptions: boolean;
  };
}

const GiftOptionsTab: React.FC<GiftOptionsTabProps> = ({
  formData,
  setFormData,
  permissions
}) => {
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(
    formData.scheduledDeliveryDate ? new Date(formData.scheduledDeliveryDate) : undefined
  );

  const handleDateSelect = (date: Date | undefined) => {
    setScheduledDate(date);
    setFormData({
      ...formData,
      scheduledDeliveryDate: date ? date.toISOString() : ''
    });
  };

  const clearScheduledDate = () => {
    setScheduledDate(undefined);
    setFormData({
      ...formData,
      scheduledDeliveryDate: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Gift Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Gift Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="giftMessage">Personal Message</Label>
              <Textarea
                id="giftMessage"
                placeholder="Write a heartfelt message for your gift recipient..."
                value={formData.giftMessage}
                onChange={(e) => setFormData({ ...formData, giftMessage: e.target.value })}
                disabled={!permissions.canEditGiftOptions}
                className={cn(
                  "min-h-[100px]",
                  !permissions.canEditGiftOptions && "bg-muted"
                )}
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 Tip: A personal message makes your gift more meaningful and memorable
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Delivery Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Scheduled Delivery Date</Label>
              <div className="flex gap-2 mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground",
                        !permissions.canEditGiftOptions && "bg-muted"
                      )}
                      disabled={!permissions.canEditGiftOptions}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                
                {scheduledDate && (
                  <Button
                    variant="outline"
                    onClick={clearScheduledDate}
                    disabled={!permissions.canEditGiftOptions}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {!scheduledDate && (
                <div className="text-xs text-muted-foreground mt-2">
                  Leave empty for standard delivery timing
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gift Presentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Gift Presentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="giftWrapping">Gift Wrapping</Label>
                <div className="text-xs text-muted-foreground">
                  Add elegant gift wrapping to your order
                </div>
              </div>
              <Switch
                id="giftWrapping"
                checked={formData.isGiftWrapped}
                onCheckedChange={(checked) => setFormData({ ...formData, isGiftWrapped: checked })}
                disabled={!permissions.canEditGiftOptions}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="surpriseGift">Surprise Gift</Label>
                <div className="text-xs text-muted-foreground">
                  Keep the gift details hidden from recipient
                </div>
              </div>
              <Switch
                id="surpriseGift"
                checked={formData.surpriseGift}
                onCheckedChange={(checked) => setFormData({ ...formData, surpriseGift: checked })}
                disabled={!permissions.canEditGiftOptions}
              />
            </div>

            {formData.surpriseGift && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <EyeOff className="h-4 w-4" />
                  <span>Surprise mode activated - recipient won't see gift details</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Special Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialInstructions">Delivery Instructions</Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special delivery instructions (e.g., gate code, preferred delivery time, etc.)"
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                disabled={!permissions.canEditGiftOptions}
                className={cn(
                  "min-h-[80px]",
                  !permissions.canEditGiftOptions && "bg-muted"
                )}
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 Examples: "Leave at front door", "Ring doorbell", "Deliver after 2 PM"
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gift Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Gift Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Gift Message:</span>
              <span>{formData.giftMessage ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span>Scheduled Delivery:</span>
              <span>{scheduledDate ? format(scheduledDate, "PP") : 'Standard'}</span>
            </div>
            <div className="flex justify-between">
              <span>Gift Wrapping:</span>
              <span>{formData.isGiftWrapped ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span>Surprise Gift:</span>
              <span>{formData.surpriseGift ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span>Special Instructions:</span>
              <span>{formData.specialInstructions ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftOptionsTab;