import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Gift, X } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import GiftMessageTemplates from './GiftMessageTemplates';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface ItemGiftMessageSectionProps {
  item: CartItem;
  recipientItems: CartItem[];
  onUpdateGiftMessage: (productId: string, message: string) => void;
  onApplyToAllRecipientItems: (recipientId: string, message: string) => void;
}

const ItemGiftMessageSection: React.FC<ItemGiftMessageSectionProps> = ({
  item,
  recipientItems,
  onUpdateGiftMessage,
  onApplyToAllRecipientItems
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tempMessage, setTempMessage] = useState('');
  
  if (!item.recipientAssignment) return null;

  const recipientName = item.recipientAssignment.connectionName;
  const recipientId = item.recipientAssignment.connectionId;
  const currentMessage = item.recipientAssignment.giftMessage || '';
  const recipientItemCount = recipientItems.length;
  const hasMultipleItems = recipientItemCount > 1;

  const handleOpenDrawer = () => {
    setTempMessage(currentMessage);
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    onUpdateGiftMessage(item.product.product_id, tempMessage);
    setIsDrawerOpen(false);
  };

  const handleApplyToAll = () => {
    onApplyToAllRecipientItems(recipientId, tempMessage);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Inline Add Button - Only shows when no message exists */}
      <button
        onClick={handleOpenDrawer}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Gift className="h-3 w-3" />
        <span>Add gift message</span>
      </button>

      {/* Gift Message Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle>Gift Message for {recipientName}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* Message Input */}
            <div className="space-y-2">
              <Textarea
                placeholder={`Write a personal message for ${recipientName}...`}
                value={tempMessage}
                onChange={(e) => setTempMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This message will be included with the gift
              </p>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick templates</p>
              <GiftMessageTemplates
                onSelectTemplate={(template) => setTempMessage(template)}
                recipientName={recipientName}
              />
            </div>
          </div>

          <DrawerFooter className="border-t pt-4">
            <div className="flex flex-col gap-2 w-full">
              <Button onClick={handleSave} className="w-full">
                Save Message
              </Button>
              
              {hasMultipleItems && tempMessage.trim() && (
                <Button 
                  variant="outline" 
                  onClick={handleApplyToAll}
                  className="w-full"
                >
                  Apply to all {recipientItemCount} items for {recipientName}
                </Button>
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ItemGiftMessageSection;
