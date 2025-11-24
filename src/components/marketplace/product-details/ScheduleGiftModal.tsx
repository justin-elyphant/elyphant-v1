import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Product } from "@/types/product";

interface ScheduleGiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

const ScheduleGiftModal: React.FC<ScheduleGiftModalProps> = ({ 
  open, 
  onOpenChange, 
  product 
}) => {
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [giftMessage, setGiftMessage] = useState("");
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const handleSchedule = () => {
    if (!scheduledDate) {
      toast.error("Please select a delivery date");
      return;
    }
    
    // Add to cart with scheduled delivery metadata
    addToCart({
      ...product,
      deliveryGroup: {
        scheduledDeliveryDate: scheduledDate.toISOString()
      },
      recipientAssignment: giftMessage ? {
        giftMessage: giftMessage
      } : undefined
    } as any);
    
    toast.success("Gift scheduled!", {
      description: `Will be delivered on ${format(scheduledDate, 'PPP')}`,
      action: {
        label: "View Cart",
        onClick: () => navigate("/cart")
      }
    });
    
    onOpenChange(false);
    setScheduledDate(undefined);
    setGiftMessage("");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-elyphant-black">
            Schedule Gift Delivery
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Date Picker */}
          <div>
            <label className="text-sm font-semibold text-elyphant-black mb-2 block">
              Delivery Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Gift Message */}
          <div>
            <label className="text-sm font-semibold text-elyphant-black mb-2 block">
              Gift Message (Optional)
            </label>
            <Textarea
              placeholder="Add a personal message..."
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-elyphant-grey-text mt-1">
              {giftMessage.length}/200 characters
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 h-11 bg-elyphant-accent hover:bg-elyphant-accent/90 text-white"
              onClick={handleSchedule}
            >
              Schedule Gift
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleGiftModal;
