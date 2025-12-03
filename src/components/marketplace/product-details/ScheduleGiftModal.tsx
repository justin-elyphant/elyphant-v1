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
import { useProfile } from "@/contexts/profile/ProfileContext";
import SimpleRecipientSelector, { SelectedRecipient } from "./SimpleRecipientSelector";

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
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  // Get user's address from profile
  const userAddress = profile?.shipping_address;
  const userName = profile?.name || "Myself";
  
  const handleSchedule = () => {
    if (!scheduledDate) {
      toast.error("Please select a delivery date");
      return;
    }
    
    // Build recipient assignment based on selection
    let recipientAssignment: any = {
      scheduledDeliveryDate: scheduledDate.toISOString()
    };
    
    if (giftMessage) {
      recipientAssignment.giftMessage = giftMessage;
    }
    
    if (selectedRecipient) {
      if (selectedRecipient.type === 'self') {
        recipientAssignment = {
          ...recipientAssignment,
          connectionId: 'self',
          connectionName: userName,
          shippingAddress: selectedRecipient.shippingAddress
        };
      } else if (selectedRecipient.type === 'connection' && selectedRecipient.connectionId) {
        recipientAssignment = {
          ...recipientAssignment,
          connectionId: selectedRecipient.connectionId,
          connectionName: selectedRecipient.connectionName,
          shippingAddress: selectedRecipient.shippingAddress
        };
      }
      // For 'later' type, we just keep the date and message
    }
    
    // Add to cart with scheduled delivery metadata
    addToCart({
      ...product,
      deliveryGroup: {
        scheduledDeliveryDate: scheduledDate.toISOString(),
        connectionId: selectedRecipient?.connectionId,
        connectionName: selectedRecipient?.connectionName
      },
      recipientAssignment
    } as any);
    
    // Build success message
    const recipientText = selectedRecipient?.type === 'self' 
      ? `to ${userName}` 
      : selectedRecipient?.type === 'connection' 
        ? `to ${selectedRecipient.connectionName}`
        : '';
    
    toast.success("Gift scheduled!", {
      description: `Will be delivered ${recipientText} on ${format(scheduledDate, 'PPP')}`.trim(),
      action: {
        label: "View Cart",
        onClick: () => navigate("/cart")
      }
    });
    
    onOpenChange(false);
    resetForm();
  };
  
  const resetForm = () => {
    setScheduledDate(undefined);
    setGiftMessage("");
    setSelectedRecipient(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Schedule Gift Delivery
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Step 1: Recipient Selection */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Who is this gift for?
            </label>
            <SimpleRecipientSelector
              value={selectedRecipient}
              onChange={setSelectedRecipient}
              userAddress={userAddress}
              userName={userName}
            />
          </div>
          
          {/* Step 2: Date Picker */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
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
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Step 3: Gift Message */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
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
            <p className="text-xs text-muted-foreground mt-1">
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
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white"
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
