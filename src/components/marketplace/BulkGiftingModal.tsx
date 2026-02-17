import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, Gift, ShoppingCart, X } from 'lucide-react';
import { useConnectionAddresses } from '@/hooks/checkout/useConnectionAddresses';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { formatPrice } from "@/lib/utils";

interface BulkGiftingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: any;
}

const BulkGiftingModal: React.FC<BulkGiftingModalProps> = ({
  open,
  onOpenChange,
  initialProduct
}) => {
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [giftMessages, setGiftMessages] = useState<Record<string, string>>({});
  const { connections } = useConnectionAddresses();
  const { addToCart, assignItemToRecipient } = useCart();

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    }
  }, [initialProduct]);

  const handleRecipientToggle = (connectionId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(connectionId) 
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const handleAddBulkGifts = () => {
    if (!selectedProduct || selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    // Add to cart for each recipient with proper assignment
    selectedRecipients.forEach(recipientId => {
      const recipient = connections.find(c => c.id === recipientId);
      if (recipient) {
        // Add product to cart
        addToCart(selectedProduct);
        
        // Assign to recipient immediately after adding
        const recipientAssignment = {
          connectionId: recipient.id,
          connectionName: recipient.name || 'Unknown User',
          deliveryGroupId: `bulk-${Date.now()}-${recipientId}`,
          giftMessage: giftMessages[recipientId] || '',
          scheduledDeliveryDate: undefined,
          shippingAddress: recipient.shipping_address || undefined
        };
        
        // Use the assignItemToRecipient function from cart context
        assignItemToRecipient(selectedProduct.product_id, recipientAssignment);
      }
    });

    toast.success(`Added ${selectedRecipients.length} gifts to cart!`);
    onOpenChange(false);
    
    // Reset state
    setSelectedRecipients([]);
    setGiftMessages({});
  };

  const acceptedConnections = connections; // useConnectionAddresses already filters for accepted

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Gifting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Product */}
          {selectedProduct && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedProduct.image_url || '/placeholder.svg'} 
                  alt={selectedProduct.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium line-clamp-1">{selectedProduct.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${selectedProduct.price_cents / 100}
                  </p>
                </div>
                <Badge variant="secondary">
                  {selectedRecipients.length} recipients
                </Badge>
              </div>
            </div>
          )}

          {/* Recipient Selection */}
          <div>
            <h3 className="font-medium mb-3">Select Recipients</h3>
            <ScrollArea className="h-60 border rounded-lg">
              <div className="p-2 space-y-2">
                {acceptedConnections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No connections available for bulk gifting</p>
                    <p className="text-sm">Add some friends first!</p>
                  </div>
                ) : (
                  acceptedConnections.map(connection => (
                    <div
                      key={connection.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedRecipients.includes(connection.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleRecipientToggle(connection.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {'User'.charAt(0).toUpperCase()}
                            </span>
                          </div>
                           <div>
                             <div className="font-medium">{connection.name}</div>
                             <div className="text-sm text-muted-foreground capitalize">
                               {connection.relationship_type}
                             </div>
                           </div>
                        </div>
                        {selectedRecipients.includes(connection.id) && (
                          <div className="text-primary">
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {selectedRecipients.includes(connection.id) && (
                        <div className="mt-3 pt-3 border-t">
                          <input
                            type="text"
                            placeholder="Optional gift message..."
                            value={giftMessages[connection.id] || ''}
                            onChange={(e) => setGiftMessages(prev => ({
                              ...prev,
                              [connection.id]: e.target.value
                            }))}
                            className="w-full px-3 py-2 border rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedRecipients.length > 0 && (
                <>Total: {formatPrice(selectedProduct?.price_cents / 100 * selectedRecipients.length)}</>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBulkGifts}
                disabled={selectedRecipients.length === 0}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add {selectedRecipients.length} Gifts to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkGiftingModal;