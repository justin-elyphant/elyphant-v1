
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Users, Gift, UserPlus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
// Legacy cart tracking removed - checkout sessions handle cart data now
// import { useCartSessionTracking } from "@/hooks/useCartSessionTracking";
// import { useCartRecovery } from "@/hooks/useCartRecovery";
import { emergencyCartCleanup } from "@/utils/cartSecurityUtils";

import UnifiedRecipientSelection from "@/components/cart/UnifiedRecipientSelection";
import UnassignedItemsSection from "@/components/cart/UnassignedItemsSection";
import CartItemImage from "@/components/cart/CartItemImage";
import MultiDestinationSummary from "@/components/cart/MultiDestinationSummary";
import ItemGiftMessageSection from "@/components/cart/ItemGiftMessageSection";
import RecipientPackagePreview from "@/components/cart/RecipientPackagePreview";
import ZincMetadataDebugger from "@/components/debug/ZincMetadataDebugger";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const Cart = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { profile: unifiedProfile } = useUnifiedProfile();
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
    updateRecipientAssignment,
    updateDeliveryGroupScheduling
  } = useCart();
  const isMobile = useIsMobile();
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Legacy cart recovery removed - checkout sessions handle cart recovery now
  // const cartRecovery = useCartRecovery();

  // Legacy cart session tracking removed - checkout sessions handle this now
  // useCartSessionTracking(...)

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please sign in to continue with checkout");
      navigate("/signin");
      return;
    }
    
    // Check for unassigned items first
    if (unassignedItems.length > 0) {
      toast.error(`Please assign all ${unassignedItems.length} item${unassignedItems.length === 1 ? '' : 's'} to recipients before checkout`);
      return;
    }
    
    // Check that all delivery groups have complete addresses
    const incompleteGroups = deliveryGroups.filter(group => {
      const addr = group.shippingAddress;
      if (!addr) return true;
      
      // Check normalized format (addresses are now pre-normalized from unifiedRecipientService)
      const hasName = addr.name?.trim();
      const hasStreet = addr.address?.trim();
      const hasCity = addr.city?.trim();
      const hasState = addr.state?.trim();
      const hasZip = Boolean(String(addr.zipCode || '').trim());
      
      const isComplete = !!(hasName && hasStreet && hasCity && hasState && hasZip);
      
      if (!isComplete) {
        console.log('🔍 [Cart] Incomplete address for', group.connectionName, {
          hasName,
          hasStreet,
          hasCity,
          hasState,
          hasZip,
          addr
        });
      }
      
      return !isComplete;
    });
    
    if (incompleteGroups.length > 0) {
      const names = incompleteGroups.map(g => g.connectionName).join(', ');
      console.info(`[Cart] Proceeding to checkout with incomplete addresses for: ${names}`);
      // Addresses can be completed inline on the checkout page; suppressing toast to avoid persistence across navigation
    }
    
    navigate("/checkout");
  };

  const handleAssignRecipient = (productId: string) => {
    setSelectedItemId(productId);
    setShowRecipientModal(true);
  };

  const handleRecipientSelect = (recipient: UnifiedRecipient) => {
    if (selectedItemId) {
      // Check if recipient is using user's address by comparing addresses
      const userShippingAddress = unifiedProfile?.shipping_address as any;
      const isUsingUserAddress = recipient.address && 
        userShippingAddress &&
        recipient.address.address === (userShippingAddress.address_line1 || userShippingAddress.street) &&
        recipient.address.city === userShippingAddress.city &&
        recipient.address.zipCode === (userShippingAddress.zip_code || userShippingAddress.zipCode);

      // Extract ZIP using robust fallback chain
      const zipCodeRaw = recipient.address 
        ? ((recipient.address as any).zip_code || 
           (recipient.address as any).zipCode || 
           (recipient.address as any).postal_code || 
           (recipient.address as any).zip ||
           (recipient.address as any).zipcode || '')
        : '';
      const zipCode = String(zipCodeRaw).trim();
      
      console.log('🔍 [Cart] Building recipient assignment:', {
        name: recipient.name,
        hasAddress: !!recipient.address,
        zipFound: !!zipCode,
        source: recipient.source
      });
      
      const recipientAssignment = {
        connectionId: recipient.id,
        connectionName: recipient.name,
        deliveryGroupId: crypto.randomUUID(),
        shippingAddress: recipient.address ? {
          name: recipient.name,
          address: recipient.address.address || '',
          addressLine2: (recipient.address as any).addressLine2 || '',
          city: recipient.address.city || '',
          state: recipient.address.state || '',
          zipCode: zipCode,
          country: recipient.address.country || 'US'
        } : undefined,
        // Privacy control: hide full address for pending connections
        isPrivateAddress: recipient.status === 'pending_invitation' || recipient.source === 'pending',
        connectionStatus: recipient.status,
        // Include verification data if using user's verified address
        ...(isUsingUserAddress && {
          address_verified: unifiedProfile?.address_verified,
          address_verification_method: unifiedProfile?.address_verification_method,
          address_verified_at: unifiedProfile?.address_verified_at,
          address_last_updated: unifiedProfile?.address_last_updated
        })
      };
      
      console.log(`🔍 [Cart] Assigning recipient ${recipient.name}:`, {
        isUsingUserAddress,
        address_verified: recipientAssignment.address_verified,
        user_verified: unifiedProfile?.address_verified
      });
      
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
          addressLine2: profile?.shipping_address?.address_line2 || profile?.shipping_address?.line2 || '',
          city: profile?.shipping_address?.city || '',
          state: profile?.shipping_address?.state || '',
          zipCode: (profile?.shipping_address?.zip_code || profile?.shipping_address?.zipCode || ''),
          country: profile?.shipping_address?.country || 'US'
        },
        // Include user's verification status
        address_verified: unifiedProfile?.address_verified,
        address_verification_method: unifiedProfile?.address_verification_method,
        address_verified_at: unifiedProfile?.address_verified_at,
        address_last_updated: unifiedProfile?.address_last_updated
      };
      
      console.log(`🔍 [Cart] Assigning user address with verification:`, {
        address_verified: unifiedProfile?.address_verified,
        verification_method: unifiedProfile?.address_verification_method,
        verified_at: unifiedProfile?.address_verified_at
      });
      
      assignItemToRecipient(item.product.product_id, recipientAssignment);
    });
    
    toast.success(`Assigned ${unassignedItems.length} items to your address`);
  };

  const handlePackageSchedulingUpdate = (groupId: string, scheduledDate: string | null) => {
    console.log(`📅 [Cart] Updating package scheduling:`, { groupId, scheduledDate });
    updateDeliveryGroupScheduling(groupId, scheduledDate);
    toast.success(scheduledDate ? 'Delivery date scheduled' : 'Delivery timing updated');
  };

  // Use centralized formatPrice from utils
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
      <ZincMetadataDebugger />
      <div className="container mx-auto px-4 py-8 max-w-4xl mobile-container mobile-content-spacing">
          {/* Legacy cart recovery removed - checkout sessions handle cart recovery */}
          
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
            <div className={`grid gap-4 lg:gap-6 ${isMobile ? 'grid-cols-1' : 'sm:grid-cols-1 lg:grid-cols-3'}`}>
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

                {/* Recipient Package Previews */}
                {deliveryGroups.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Package Previews</h3>
                    <div className="grid gap-4">
                      {deliveryGroups.map(group => (
                        <RecipientPackagePreview
                          key={group.id}
                          deliveryGroup={group}
                          cartItems={cartItems}
                          onPackageSchedulingUpdate={handlePackageSchedulingUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Cart Items with Item-Level Recipient Assignment */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">All Items</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.product.product_id} className="p-4 border rounded-lg mobile-card">
                        <div className="flex gap-3 lg:gap-4">
                          <div className="flex-shrink-0">
                            <CartItemImage item={item} size="md" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-2 mb-1">
                              {item.product.name || item.product.title}
                            </h3>
                            {/* Display variation details if available */}
                            {((item.product as any).variationText || (item.product as any).selectedVariations) && (
                              <p className="text-xs text-blue-600 mb-1 font-medium">
                                {(item.product as any).variationText || (item.product as any).selectedVariations}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.product.vendor && `By ${item.product.vendor}`}
                            </p>
                            
                            <p className="text-lg font-semibold text-green-600">
                              {formatPrice(item.product.price, {
                                productSource: item.product.productSource || (item.product.isZincApiProduct ? 'zinc_api' : undefined),
                                skipCentsDetection: item.product.skipCentsDetection
                              })}
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
                        
                        {/* Enhanced Recipient Assignment Section with Gift Messages */}
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {item.recipientAssignment ? (
                            <>
                              {/* Recipient Info */}
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

                              {/* Item-Level Gift Message Section */}
                              <ItemGiftMessageSection
                                item={item}
                                recipientItems={cartItems.filter(
                                  cartItem => cartItem.recipientAssignment?.connectionId === item.recipientAssignment?.connectionId
                                )}
                                onUpdateGiftMessage={(productId, message) => {
                                  updateRecipientAssignment(productId, { giftMessage: message });
                                }}
                                onApplyToAllRecipientItems={(recipientId, message) => {
                                  cartItems
                                    .filter(cartItem => cartItem.recipientAssignment?.connectionId === recipientId)
                                    .forEach(cartItem => {
                                      updateRecipientAssignment(cartItem.product.product_id, { giftMessage: message });
                                    });
                                }}
                              />
                            </>
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
                    
                    <div className="flex justify-between items-baseline">
                      <span>Shipping</span>
                      <span className="text-right">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span>Tax</span>
                      <span className="text-right">Calculated at checkout</span>
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
                      <>
                        <Button 
                          variant="ghost"
                          onClick={clearCart}
                          className="w-full text-red-500 hover:text-red-700"
                          size="sm"
                        >
                          Clear Cart
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm('⚠️ EMERGENCY FULL RESET\n\nThis will:\n• Delete ALL server cart data (user_carts + cart_sessions)\n• Clear all local cart data\n• Reload the page\n\nUse this if cart issues persist.\n\nContinue?')) {
                              try {
                                if (!user?.id) {
                                  toast.error('Must be logged in');
                                  return;
                                }
                                
                                toast.success('Server cart data cleared (legacy tables removed)');
                                console.log('🧹 Server cleanup: Legacy cart_sessions and user_carts tables have been removed');
                                
                                toast.loading('Running local cleanup...');
                                // emergencyCartCleanup() will reload the page
                                emergencyCartCleanup();
                              } catch (error) {
                                console.error('❌ Emergency reset failed:', error);
                                toast.error('Emergency reset failed - check console');
                              }
                            }
                          }}
                          className="w-full text-xs text-muted-foreground hover:text-destructive"
                        >
                          Emergency Full Reset
                        </Button>
                      </>
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
