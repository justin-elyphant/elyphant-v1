
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Users, Gift, UserPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/contexts/profile/ProfileContext";

import UnifiedRecipientSelection from "@/components/cart/UnifiedRecipientSelection";
import UnassignedItemsSection from "@/components/cart/UnassignedItemsSection";
import MultiDestinationSummary from "@/components/cart/MultiDestinationSummary";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const Cart = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { 
    cartItems, 
    cartTotal, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    deliveryGroups,
    getUnassignedItems,
    assignItemToRecipient,
    unassignItemFromRecipient,
    updateRecipientAssignment
  } = useCart();
  const isMobile = useIsMobile();
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please sign in to continue with checkout");
      navigate("/signin");
      return;
    }
    
    // Check for complete shipping address
    const shippingAddress = profile?.shipping_address;
    const hasCompleteAddress = shippingAddress && 
      profile?.name &&
      (shippingAddress.address_line1 || shippingAddress.street) &&
      shippingAddress.city &&
      shippingAddress.state &&
      (shippingAddress.zip_code || shippingAddress.zipCode);
    
    if (!hasCompleteAddress) {
      toast.error("Please add your shipping address before checkout");
      navigate('/settings', { state: { tab: 'profile' } });
      return;
    }
    
    navigate("/checkout");
  };

  const handleAssignRecipient = (productId: string) => {
    setSelectedItemId(productId);
    setShowRecipientModal(true);
  };

  const handleRecipientSelect = (recipient: UnifiedRecipient) => {
    if (selectedItemId) {
      const recipientAssignment = {
        connectionId: recipient.id,
        connectionName: recipient.name,
        deliveryGroupId: crypto.randomUUID(),
        shippingAddress: recipient.address
      };
      
      if (selectedItemId === 'bulk') {
        // Assign all unassigned items to this recipient
        unassignedItems.forEach(item => {
          assignItemToRecipient(item.product.product_id, recipientAssignment);
        });
        toast.success(`Assigned ${unassignedItems.length} items to ${recipient.name}`);
      } else {
        // Assign single item
        assignItemToRecipient(selectedItemId, recipientAssignment);
        toast.success(`Assigned item to ${recipient.name}`);
      }
      
      setShowRecipientModal(false);
      setSelectedItemId(null);
    }
  };

  const handleUnassignRecipient = (productId: string) => {
    unassignItemFromRecipient(productId);
  };

  const handleAssignAllToRecipients = () => {
    // Open recipient selection for bulk assignment
    setSelectedItemId('bulk');
    setShowRecipientModal(true);
  };

  const handleAssignAllToMe = () => {
    // Assign all unassigned items to user's address
    unassignedItems.forEach(item => {
      const recipientAssignment = {
        connectionId: 'self',
        connectionName: profile?.name || 'You',
        deliveryGroupId: 'self',
        shippingAddress: {
          name: profile?.name || '',
          address: (profile?.shipping_address?.address_line1 || profile?.shipping_address?.street || ''),
          city: profile?.shipping_address?.city || '',
          state: profile?.shipping_address?.state || '',
          zipCode: (profile?.shipping_address?.zip_code || profile?.shipping_address?.zipCode || ''),
          country: profile?.shipping_address?.country || 'US'
        }
      };
      
      assignItemToRecipient(item.product.product_id, recipientAssignment);
    });
    
    toast.success(`Assigned ${unassignedItems.length} items to your address`);
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const unassignedItems = getUnassignedItems();
  
  // Check shipping address validity for UI feedback
  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="touch-target-44"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                {deliveryGroups.length > 0 && (
                  <span className="ml-2">
                    • {deliveryGroups.length} recipient{deliveryGroups.length === 1 ? '' : 's'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start shopping to add items to your cart
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
              {/* Cart Content */}
              <div className={isMobile ? 'order-1' : 'lg:col-span-2'}>
                {/* Multi-Destination Summary */}
                <MultiDestinationSummary 
                  deliveryGroups={deliveryGroups} 
                  unassignedItems={unassignedItems} 
                />
                
                {/* Unassigned Items Section */}
                <UnassignedItemsSection 
                  unassignedItems={unassignedItems}
                  onAssignAll={handleAssignAllToRecipients}
                  onAssignToMe={handleAssignAllToMe}
                />
                
                {/* Cart Items with Item-Level Recipient Assignment */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">All Items</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.product.product_id} className="p-4 border rounded-lg">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <img 
                              src={item.product.image || "/placeholder.svg"} 
                              alt={item.product.name || item.product.title}
                              className="w-20 h-20 object-cover rounded-md bg-gray-100"
                              loading="lazy"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-2 mb-1">
                              {item.product.name || item.product.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.product.vendor && `By ${item.product.vendor}`}
                            </p>
                            
                            <p className="text-lg font-semibold text-green-600">
                              {formatPrice(item.product.price)}
                            </p>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border rounded">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8 p-0 touch-target-44"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                                  disabled={item.quantity >= 10}
                                  className="h-8 w-8 p-0 touch-target-44"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.product.product_id)}
                                className="text-red-500 hover:text-red-700 touch-target-44"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Recipient Assignment Section */}
                        <div className="mt-4 pt-4 border-t">
                          {item.recipientAssignment ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Gift className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">
                                  Assigned to {item.recipientAssignment.connectionName}
                                </span>
                                {item.recipientAssignment.shippingAddress && (
                                  <span className="text-sm text-muted-foreground">
                                    • {item.recipientAssignment.shippingAddress.city}, {item.recipientAssignment.shippingAddress.state}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignRecipient(item.product.product_id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  Change
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnassignRecipient(item.product.product_id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-orange-600">
                                  Not assigned to recipient
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignRecipient(item.product.product_id)}
                                className="flex items-center gap-2"
                              >
                                <UserPlus className="h-4 w-4" />
                                Assign Recipient
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Order Summary */}
              <div className={isMobile ? 'order-2' : ''}>
                <div className="border rounded-lg p-6 sticky top-4">
                  <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    
                    {deliveryGroups.length > 0 && (
                      <div className="flex justify-between">
                        <span>Recipients</span>
                        <span>{deliveryGroups.length} people</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold mb-6">
                    <span>Total</span>
                    <span className="text-green-600">{formatPrice(cartTotal)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleCheckout}
                      className="w-full"
                      size={isMobile ? "lg" : "default"}
                      disabled={!hasCompleteAddress}
                    >
                      {hasCompleteAddress ? 'Proceed to Checkout' : 'Add Shipping Address'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/marketplace")}
                      className="w-full"
                      size={isMobile ? "lg" : "default"}
                    >
                      Continue Shopping
                    </Button>
                    
                    {cartItems.length > 0 && (
                      <Button 
                        variant="ghost"
                        onClick={clearCart}
                        className="w-full text-red-500 hover:text-red-700"
                        size="sm"
                      >
                        Clear Cart
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recipient Selection Modal */}
          {showRecipientModal && (
            <UnifiedRecipientSelection
              onRecipientSelect={handleRecipientSelect}
              onClose={() => {
                setShowRecipientModal(false);
                setSelectedItemId(null);
              }}
              title="Select Recipient"
              selectedRecipientId={selectedItemId}
            />
          )}
        </div>
    </SidebarLayout>
  );
};

export default Cart;
