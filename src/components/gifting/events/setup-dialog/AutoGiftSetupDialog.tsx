
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, DollarSign, Bell, ShoppingCart, Sparkles } from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import AutoGiftProductSelector from "../edit-drawer/gift-settings/AutoGiftProductSelector";
import { toast } from "sonner";

interface AutoGiftSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventType?: string;
  recipientId?: string;
  onSave?: (settings: any) => void;
}

const AutoGiftSetupDialog: React.FC<AutoGiftSetupDialogProps> = ({
  open,
  onOpenChange,
  eventId,
  eventType,
  recipientId,
  onSave
}) => {
  const { createRule, settings } = useAutoGifting();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    budgetLimit: settings?.default_budget_limit || 50,
    autoApproveGifts: false,
    giftMessage: "",
    giftSource: "wishlist" as "wishlist" | "ai" | "both" | "specific",
    categories: [] as string[],
    specificProductId: undefined as string | undefined,
    notificationDays: [7, 3, 1],
    emailNotifications: true,
    pushNotifications: false,
  });

  const availableCategories = [
    "Electronics", "Fashion", "Books", "Home & Garden", 
    "Sports", "Beauty", "Toys", "Jewelry", "Art", "Kitchen"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventType || !recipientId) {
      toast.error("Event type and recipient are required");
      return;
    }

    setIsLoading(true);

    try {
      await createRule({
        recipient_id: recipientId,
        date_type: eventType,
        event_id: eventId,
        is_active: true,
        budget_limit: formData.budgetLimit,
        gift_message: formData.giftMessage,
        created_from_event_id: eventId,
        notification_preferences: {
          enabled: formData.emailNotifications || formData.pushNotifications,
          days_before: formData.notificationDays,
          email: formData.emailNotifications,
          push: formData.pushNotifications,
        },
        gift_selection_criteria: {
          source: formData.giftSource,
          max_price: formData.budgetLimit,
          min_price: Math.max(1, formData.budgetLimit * 0.1), // Minimum 10% of budget
          categories: formData.categories,
          exclude_items: [],
          specific_product_id: formData.specificProductId,
        },
      });

      toast.success("Auto-gifting rule created successfully!", {
        description: "Your automated gift will be processed based on your preferences"
      });
      
      onOpenChange(false);
      
      if (onSave) {
        onSave({
          budgetLimit: formData.budgetLimit,
          autoApproveGifts: formData.autoApproveGifts,
          giftMessage: formData.giftMessage,
          giftSource: formData.giftSource,
          categories: formData.categories,
          specificProductId: formData.specificProductId,
          notificationDays: formData.notificationDays,
          emailNotifications: formData.emailNotifications,
          pushNotifications: formData.pushNotifications,
        });
      }
      
      // Reset form
      setFormData({
        budgetLimit: settings?.default_budget_limit || 50,
        autoApproveGifts: false,
        giftMessage: "",
        giftSource: "wishlist",
        categories: [],
        specificProductId: undefined,
        notificationDays: [7, 3, 1],
        emailNotifications: true,
        pushNotifications: false,
      });

    } catch (error) {
      console.error("Error creating auto-gift rule:", error);
      toast.error("Failed to create auto-gifting rule");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Set Up Auto-Gifting for {eventType}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Budget Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <Label className="text-base font-medium">Budget & Approval</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget Limit ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.budgetLimit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetLimit: Number(e.target.value) 
                  }))}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="autoApprove"
                  checked={formData.autoApproveGifts}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    autoApproveGifts: !!checked 
                  }))}
                />
                <Label htmlFor="autoApprove" className="text-sm">
                  Auto-approve purchases
                </Label>
              </div>
            </div>
          </div>

          {/* Gift Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <Label className="text-base font-medium">Gift Selection</Label>
            </div>
            
            <div>
              <Label htmlFor="giftSource">Gift Source</Label>
              <Select 
                value={formData.giftSource} 
                onValueChange={(value: "wishlist" | "ai" | "both" | "specific") => 
                  setFormData(prev => ({ ...prev, giftSource: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wishlist">From Recipient's Wishlist</SelectItem>
                  <SelectItem value="ai">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      AI Recommendations via Zinc API
                    </div>
                  </SelectItem>
                  <SelectItem value="both">Wishlist + AI Backup</SelectItem>
                  <SelectItem value="specific">Specific Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific product selection */}
            {formData.giftSource === "specific" && (
              <AutoGiftProductSelector
                onSelectProduct={(productId) => setFormData(prev => ({ 
                  ...prev, 
                  specificProductId: productId 
                }))}
                selectedProductId={formData.specificProductId}
              />
            )}

            {/* Category preferences for AI selection */}
            {(formData.giftSource === "ai" || formData.giftSource === "both") && (
              <div>
                <Label>Preferred Categories for AI Selection</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Help our AI find better gift suggestions by selecting preferred categories
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={formData.categories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="giftMessage">Custom Gift Message (Optional)</Label>
              <Textarea
                id="giftMessage"
                placeholder="Happy Birthday! Hope you love this gift..."
                value={formData.giftMessage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  giftMessage: e.target.value 
                }))}
                maxLength={255}
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Label className="text-base font-medium">Notifications</Label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    emailNotifications: !!checked 
                  }))}
                />
                <Label htmlFor="emailNotifications">Email notifications</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushNotifications"
                  checked={formData.pushNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    pushNotifications: !!checked 
                  }))}
                />
                <Label htmlFor="pushNotifications">Push notifications</Label>
              </div>
            </div>

            <div>
              <Label>Notify me (days before event)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 3, 7, 14].map((day) => (
                  <Badge
                    key={day}
                    variant={formData.notificationDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        notificationDays: prev.notificationDays.includes(day)
                          ? prev.notificationDays.filter(d => d !== day)
                          : [...prev.notificationDays, day].sort((a, b) => b - a)
                      }));
                    }}
                  >
                    {day} day{day !== 1 ? 's' : ''}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Auto-Gift Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AutoGiftSetupDialog;
