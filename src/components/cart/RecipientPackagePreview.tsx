import React, { useState } from 'react';
import { ChevronDown, Package, Calendar, Gift } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { DeliveryGroup } from '@/types/recipient';
import { cn } from '@/lib/utils';
import { formatScheduledDate } from '@/utils/dateUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import DeliverySchedulingDrawer from './DeliverySchedulingDrawer';

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

  const groupItems = cartItems.filter(
    item => item.recipientAssignment?.connectionId === deliveryGroup.connectionId
  );

  // Get unique gift messages
  const uniqueMessages = new Set(
    groupItems
      .map(item => item.recipientAssignment?.giftMessage)
      .filter(Boolean)
  );

  const handleDateUpdate = (date: string | null) => {
    onPackageSchedulingUpdate?.(deliveryGroup.id, date);
    setShowSchedulingDrawer(false);
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
      </Collapsible>

      {/* Delivery Scheduling Drawer */}
      <DeliverySchedulingDrawer
        open={showSchedulingDrawer}
        onOpenChange={setShowSchedulingDrawer}
        recipientName={deliveryGroup.connectionName}
        currentDate={deliveryGroup.scheduledDeliveryDate}
        onDateUpdate={handleDateUpdate}
      />
    </>
  );
};

export default RecipientPackagePreview;
