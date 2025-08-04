import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageCircle, Package, Users, Edit3, Check, X, Sparkles, ChevronDown } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { RecipientAssignment } from '@/types/recipient';
import GiftMessageTemplates from './GiftMessageTemplates';

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
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState(item.recipientAssignment?.giftMessage || '');
  const [showTemplates, setShowTemplates] = useState(false);
  
  if (!item.recipientAssignment) return null;

  const recipientName = item.recipientAssignment.connectionName;
  const recipientId = item.recipientAssignment.connectionId;
  const currentMessage = item.recipientAssignment.giftMessage || '';
  
  // Count how many items share the same gift message for this recipient
  const itemsWithSameMessage = recipientItems.filter(
    recipientItem => recipientItem.recipientAssignment?.giftMessage === currentMessage
  );
  
  const recipientItemCount = recipientItems.length;
  const hasMultipleItems = recipientItemCount > 1;
  const allItemsHaveSameMessage = itemsWithSameMessage.length === recipientItemCount;

  const handleSave = () => {
    onUpdateGiftMessage(item.product.product_id, tempMessage);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempMessage(currentMessage);
    setIsEditing(false);
  };

  const handleApplyToAll = () => {
    onApplyToAllRecipientItems(recipientId, tempMessage);
    setIsEditing(false);
  };

  const getMessageStatus = () => {
    if (!currentMessage) {
      return {
        type: 'none' as const,
        color: 'text-muted-foreground',
        icon: MessageCircle,
        text: 'No gift message'
      };
    }
    
    if (hasMultipleItems && allItemsHaveSameMessage) {
      return {
        type: 'shared' as const,
        color: 'text-blue-600',
        icon: Package,
        text: `Shared across all ${recipientItemCount} items`
      };
    }
    
    if (hasMultipleItems && !allItemsHaveSameMessage) {
      return {
        type: 'individual' as const,
        color: 'text-orange-600',
        icon: Edit3,
        text: 'Individual message for this item'
      };
    }
    
    return {
      type: 'single' as const,
      color: 'text-green-600',
      icon: MessageCircle,
      text: 'Gift message added'
    };
  };

  const messageStatus = getMessageStatus();

  return (
    <div className="space-y-3">
      {/* Message Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <messageStatus.icon className={`h-4 w-4 ${messageStatus.color}`} />
          <span className={`text-sm font-medium ${messageStatus.color}`}>
            {messageStatus.text}
          </span>
          {hasMultipleItems && (
            <Badge variant="secondary" className="text-xs">
              {recipientItemCount} items for {recipientName}
            </Badge>
          )}
        </div>
        
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempMessage(currentMessage);
              setIsEditing(true);
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            {currentMessage ? 'Edit' : 'Add Message'}
          </Button>
        )}
      </div>

      {/* Display Current Message */}
      {currentMessage && !isEditing && (
        <Card className="bg-muted/30">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">{currentMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package Preview for Multiple Items */}
      {hasMultipleItems && !isEditing && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {recipientName}'s Package Preview
            </span>
          </div>
          <div className="text-sm text-blue-700">
            {allItemsHaveSameMessage ? (
              <p>All {recipientItemCount} items will be delivered together with the same gift message.</p>
            ) : (
              <p>Items will be delivered together, but some have different gift messages.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Message Form */}
      {isEditing && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Textarea
              placeholder={`Add a personal message for ${recipientName}...`}
              value={tempMessage}
              onChange={(e) => setTempMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            
            {/* Quick Template Access */}
            <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-primary hover:text-primary"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Use message template
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <GiftMessageTemplates
                      onSelectTemplate={(template) => {
                        setTempMessage(template);
                        setShowTemplates(false);
                      }}
                      recipientName={recipientName}
                    />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
            
            {hasMultipleItems && tempMessage.trim() && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleApplyToAll}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                Apply to All {recipientItemCount} Items
              </Button>
            )}
          </div>
          
          {hasMultipleItems && (
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Package-aware messaging:</p>
                  <p>
                    {recipientName} will receive all {recipientItemCount} items in one package. 
                    Consider using "Apply to All" to avoid multiple messages in the same delivery.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemGiftMessageSection;