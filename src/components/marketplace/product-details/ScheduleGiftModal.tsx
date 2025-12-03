import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useAuth } from "@/contexts/auth";
import SimpleRecipientSelector, { SelectedRecipient } from "./SimpleRecipientSelector";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { RecipientAssignment } from "@/types/recipient";

interface ScheduleGiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  // Variant props from parent
  hasVariations?: boolean;
  getEffectiveProductId?: () => string;
  getVariationDisplayText?: () => string;
  isVariationComplete?: () => boolean;
}

const ScheduleGiftModal: React.FC<ScheduleGiftModalProps> = ({ 
  open, 
  onOpenChange, 
  product,
  hasVariations = false,
  getEffectiveProductId,
  getVariationDisplayText,
  isVariationComplete
}) => {
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [giftMessage, setGiftMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const { addToCart, assignItemToRecipient } = useCart();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { user } = useAuth();
  
  // Get user's address from profile
  const userAddress = profile?.shipping_address;
  const userName = profile?.name || "Myself";

  // Handle inviting a new recipient
  const handleInviteNew = async (name: string, email: string) => {
    if (!user) {
      toast.error("Please sign in to invite recipients");
      return;
    }
    
    setIsInviting(true);
    try {
      const connection = await unifiedGiftManagementService.createPendingConnection(
        email,
        name,
        "friend",
        user.id
      );
      
      if (connection && connection.id) {
        // Select the newly created connection
        setSelectedRecipient({
          type: 'connection',
          connectionId: connection.id,
          connectionName: name,
          addressVerified: false
        });
        toast.success("Invitation sent!", {
          description: `${name} will receive an email to share their address`
        });
      } else {
        toast.error("Failed to send invitation", {
          description: "Please try again"
        });
      }
    } catch (error) {
      console.error("Error inviting recipient:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };
  
  const handleSchedule = () => {
    // Validate variation selection first
    if (hasVariations && isVariationComplete && !isVariationComplete()) {
      toast.error("Please select all product options", {
        description: "Choose size, color, and other options before scheduling"
      });
      return;
    }
    
    if (!scheduledDate) {
      toast.error("Please select a delivery date");
      return;
    }
    
    // Get effective product ID (selected variant or base product)
    const effectiveProductId = getEffectiveProductId ? getEffectiveProductId() : String(product.product_id || product.id);
    const variationText = getVariationDisplayText ? getVariationDisplayText() : undefined;
    
    // Build variant-aware cart product - explicitly include image/images from the (variant) product
    const cartProduct = {
      ...product,
      product_id: effectiveProductId,
      image: product.image, // Ensure variant image is passed
      images: product.images, // Ensure variant images array is passed
      variationText: variationText || undefined
    };
    
    // Step 1: Add to cart with variant info
    addToCart(cartProduct);
    
    // Step 2: Assign recipient AFTER adding to cart (correct pattern)
    if (selectedRecipient && selectedRecipient.type !== 'later') {
      const recipientAssignment: RecipientAssignment = {
        connectionId: selectedRecipient.type === 'self' ? 'self' : (selectedRecipient.connectionId || ''),
        connectionName: selectedRecipient.type === 'self' ? userName : (selectedRecipient.connectionName || ''),
        deliveryGroupId: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduledDeliveryDate: scheduledDate.toISOString(),
        giftMessage: giftMessage || undefined,
        shippingAddress: selectedRecipient.shippingAddress,
        address_verified: selectedRecipient.addressVerified
      };
      
      // Assign recipient to the cart item
      assignItemToRecipient(effectiveProductId, recipientAssignment);
    }
    
    // Build success message
    const recipientText = selectedRecipient?.type === 'self' 
      ? `to ${userName}` 
      : selectedRecipient?.type === 'connection' 
        ? `to ${selectedRecipient.connectionName}`
        : '';
    
    const variantInfo = variationText ? ` (${variationText})` : '';
    
    toast.success("Gift scheduled!", {
      description: `Will be delivered ${recipientText} on ${format(scheduledDate, 'PPP')}${variantInfo}`.trim(),
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
              onInviteNew={handleInviteNew}
            />
            
            {/* Address Verification Status */}
            {selectedRecipient && selectedRecipient.type !== 'later' && (
              <div className="mt-2">
                {selectedRecipient.type === 'self' || selectedRecipient.addressVerified ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Address verified</span>
                  </div>
                ) : selectedRecipient.addressVerified === false ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Address not verified - recipient will be asked to confirm</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Address will be verified at checkout</span>
                  </div>
                )}
              </div>
            )}
            
            {isInviting && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Sending invitation...</span>
              </div>
            )}
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
              <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
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
