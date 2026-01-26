import React, { useState, useMemo } from 'react';
import { ChevronDown, Package, Calendar, Gift } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { DeliveryGroup, RecipientAssignment } from '@/types/recipient';
import { cn } from '@/lib/utils';
import { formatScheduledDate } from '@/utils/dateUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { detectHolidayFromDate } from '@/constants/holidayDates';
import { useAutoGifting } from '@/hooks/useAutoGifting';
import UnifiedGiftSchedulingModal from '@/components/gifting/unified/UnifiedGiftSchedulingModal';
import RecurringGiftUpsellBanner from './RecurringGiftUpsellBanner';
import AutoGiftSetupFlow from '@/components/gifting/auto-gift/AutoGiftSetupFlow';

interface RecipientPackagePreviewProps {
  deliveryGroup: DeliveryGroup;
  cartItems: CartItem[];
  onPackageSchedulingUpdate?: (groupId: string, scheduledDate: string | null) => void;
}

const RecipientPackagePreview: React.FC<RecipientPackagePreviewProps> = ({
  deliveryGroup,
  cartItems,
  onPackageSchedulingUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSchedulingDrawer, setShowSchedulingDrawer] = useState(false);
  const [showRecurringSetup, setShowRecurringSetup] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  const { rules } = useAutoGifting();

  const groupItems = cartItems.filter(
    item => item.recipientAssignment?.connectionId === deliveryGroup.connectionId
  );

  // Detect if scheduled date is a holiday
  const detectedHoliday = useMemo(() => {
    if (!deliveryGroup.scheduledDeliveryDate) return null;
    return detectHolidayFromDate(new Date(deliveryGroup.scheduledDeliveryDate));
  }, [deliveryGroup.scheduledDeliveryDate]);

  // Check if rule already exists for this recipient + occasion
  const hasExistingRule = useMemo(() => {
    if (!detectedHoliday) return false;
    return rules.some(r => 
      r.recipient_id === deliveryGroup.connectionId && 
      r.date_type === detectedHoliday.key &&
      r.is_active
    );
  }, [rules, deliveryGroup.connectionId, detectedHoliday]);

  // Show banner if holiday detected, no existing rule, not dismissed
  const showUpsellBanner = detectedHoliday && !hasExistingRule && !bannerDismissed;

  // Get unique gift messages
  const uniqueMessages = new Set(
    groupItems
      .map(item => item.recipientAssignment?.giftMessage)
      .filter(Boolean)
  );

  const handleSchedulingComplete = (result: any) => {
    if (result.scheduledDate) {
      onPackageSchedulingUpdate?.(deliveryGroup.id, result.scheduledDate);
    }
    setShowSchedulingDrawer(false);
  };

  const handleRecurringSetupComplete = () => {
    setShowRecurringSetup(false);
    setBannerDismissed(true); // Hide banner after successful setup
  };

  // Build recipient assignment for the modal
  const existingRecipient: RecipientAssignment = {
    connectionId: deliveryGroup.connectionId,
    connectionName: deliveryGroup.connectionName,
    deliveryGroupId: deliveryGroup.id,
    scheduledDeliveryDate: deliveryGroup.scheduledDeliveryDate,
    shippingAddress: deliveryGroup.shippingAddress,
    address_verified: deliveryGroup.address_verified,
    giftMessage: groupItems[0]?.recipientAssignment?.giftMessage
  };

  // Build product hints from cart items for recurring setup
  const buildProductHints = () => {
    if (groupItems.length === 0) return undefined;
    const firstProduct = groupItems[0].product;
    const totalPrice = groupItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    return {
      productId: String(firstProduct.product_id || firstProduct.id),
      title: firstProduct.title || firstProduct.name || '',
      brand: firstProduct.brand,
      category: firstProduct.category || firstProduct.category_name,
      priceRange: [Math.floor(totalPrice * 0.8), Math.ceil(totalPrice * 1.2)] as [number, number],
      image: firstProduct.image
    };
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="bg-background border rounded-lg">
          {/* Collapsed Header - Always Visible */}
          <CollapsibleTrigger className="w-full">
            <div className="flex items-start justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-1 min-w-0">
                  <span className="font-medium text-left">{deliveryGroup.connectionName}</span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>({groupItems.length} {groupItems.length === 1 ? 'item' : 'items'})</span>
                    {deliveryGroup.scheduledDeliveryDate && (
                      <span className="flex items-center gap-1">
                        <span className="hidden sm:inline">•</span>
                        <Calendar className="h-3 w-3" />
                        {formatScheduledDate(deliveryGroup.scheduledDeliveryDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <ChevronDown 
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ml-2 mt-0.5",
                  isOpen && "rotate-180"
                )} 
              />
            </div>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t">
              {/* Contents List */}
              <div className="pt-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Contents</p>
                <ul className="space-y-1">
                  {groupItems.map(item => (
                    <li key={item.product.product_id} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      <span className="truncate">{item.product.name || item.product.title}</span>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gift Messages Summary */}
              {uniqueMessages.size > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Gift Messages</p>
                  {Array.from(uniqueMessages).map((message, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded">
                      <Gift className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">"{message}"</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Date Action */}
              <div className="pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSchedulingDrawer(true);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  {deliveryGroup.scheduledDeliveryDate ? 'Edit delivery date' : 'Schedule delivery date'}
                </button>
              </div>
            </div>
          </CollapsibleContent>
        </div>
        
        {/* Holiday Upsell Banner - Shows outside the collapsible */}
        {showUpsellBanner && (
          <RecurringGiftUpsellBanner
            holidayLabel={detectedHoliday?.label || ''}
            recipientName={deliveryGroup.connectionName}
            visible={true}
            onConvert={() => setShowRecurringSetup(true)}
            onDismiss={() => setBannerDismissed(true)}
          />
        )}
      </Collapsible>

      {/* Unified Gift Scheduling Modal (date-only mode from cart) */}
      <UnifiedGiftSchedulingModal
        open={showSchedulingDrawer}
        onOpenChange={setShowSchedulingDrawer}
        existingRecipient={existingRecipient}
        defaultMode="one-time"
        allowModeSwitch={false}
        onComplete={handleSchedulingComplete}
      />
      
      {/* Recurring Gift Setup (from banner conversion) */}
      <AutoGiftSetupFlow
        open={showRecurringSetup}
        onOpenChange={setShowRecurringSetup}
        embedded={false}
        recipientId={deliveryGroup.connectionId}
        eventType={detectedHoliday?.key}
        onComplete={handleRecurringSetupComplete}
        productHints={buildProductHints()}
      />
    </>
  );
};

export default RecipientPackagePreview;
