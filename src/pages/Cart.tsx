
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Gift, UserPlus, Calendar, Pencil } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { emergencyCartCleanup } from "@/utils/cartSecurityUtils";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

import UnifiedRecipientSelection from "@/components/cart/UnifiedRecipientSelection";
import UnassignedItemsSection from "@/components/cart/UnassignedItemsSection";
import CartItemImage from "@/components/cart/CartItemImage";
import ItemGiftMessageSection from "@/components/cart/ItemGiftMessageSection";
import RecipientPackagePreview from "@/components/cart/RecipientPackagePreview";
import ZincMetadataDebugger from "@/components/debug/ZincMetadataDebugger";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import MainLayout from "@/components/layout/MainLayout";
import { unifiedPaymentService } from '@/services/payment/UnifiedPaymentService';
import { formatScheduledDate } from "@/utils/dateUtils";

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
  const { isPhone, isTablet, usesMobileShell } = useResponsiveLayout();
  const isMobile = usesMobileShell; // Keep existing behavior for mobile shell (bottom nav, safe areas)
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleCheckout = async () => {
    triggerHapticFeedback(HapticPatterns.addToCart);
    
    // Guest checkout allowed - users can enter shipping at checkout
    // No authentication required for shared wishlist purchases
    
    // For authenticated users with unassigned items, check shipping address
    // For guests, they'll enter shipping info at checkout
    if (user && unassignedItems.length > 0) {
      const shippingAddress = profile?.shipping_address;
      const hasCompleteAddress = shippingAddress && 
        profile?.name &&
        (shippingAddress.address_line1 || shippingAddress.street) &&
        shippingAddress.city &&
        shippingAddress.state &&
        (shippingAddress.zip_code || shippingAddress.zipCode);
      
      if (!hasCompleteAddress) {
        triggerHapticFeedback(HapticPatterns.errorAction);
        toast.error(
          "Please complete your shipping address or assign recipients before checkout. " +
          "Unassigned items will be shipped to your address."
        );
        return;
      }
      
      console.log(`✅ [Cart] Proceeding with ${unassignedItems.length} unassigned item(s) - will ship to user address`);
    }
    
    // Check that all delivery groups have complete addresses
    const incompleteGroups = deliveryGroups.filter(group => {
      const addr = group.shippingAddress;
      if (!addr) return true;
      
      const hasName = addr.name?.trim();
      const hasStreet = addr.address?.trim();
      const hasCity = addr.city?.trim();
      const hasState = addr.state?.trim();
      const hasZip = Boolean(String(addr.zipCode || '').trim());
      
      const isComplete = !!(hasName && hasStreet && hasCity && hasState && hasZip);
      
      if (!isComplete) {
        console.log('🔍 [Cart] Incomplete address for', group.connectionName, {
          hasName, hasStreet, hasCity, hasState, hasZip, addr
        });
      }
      
      return !isComplete;
    });
    
    if (incompleteGroups.length > 0) {
      const names = incompleteGroups.map(g => g.connectionName).join(', ');
      console.info(`[Cart] Proceeding to checkout with incomplete addresses for: ${names}`);
    }
    
    // Flush any pending cart saves before navigation
    console.log('🔄 [Cart] Flushing pending cart saves before checkout navigation');
    await unifiedPaymentService.flushPendingSaves();
    
    navigate("/checkout");
  };

  // Haptic-enabled handlers
  const handleQuantityChange = (productId: string, newQty: number) => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    updateQuantity(productId, newQty);
  };

  const handleRemoveItem = (productId: string) => {
    triggerHapticFeedback(HapticPatterns.removeItem);
    removeFromCart(productId);
  };

  const handleAssignRecipient = (productId: string) => {
    setSelectedItemId(productId);
    setShowRecipientModal(true);
  };

  const handleRecipientSelect = (recipient: UnifiedRecipient) => {
    if (selectedItemId) {
      const userShippingAddress = unifiedProfile?.shipping_address as any;
      const isUsingUserAddress = recipient.address && 
        userShippingAddress &&
        recipient.address.address === (userShippingAddress.address_line1 || userShippingAddress.street) &&
        recipient.address.city === userShippingAddress.city &&
        recipient.address.zipCode === (userShippingAddress.zip_code || userShippingAddress.zipCode);

      const zipCodeRaw = recipient.address 
        ? ((recipient.address as any).zip_code || 
           (recipient.address as any).zipCode || 
           (recipient.address as any).postal_code || 
           (recipient.address as any).zip ||
           (recipient.address as any).zipcode || '')
        : '';
      const zipCode = String(zipCodeRaw).trim();
      
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
        isPrivateAddress: recipient.status === 'pending_invitation' || recipient.source === 'pending',
        connectionStatus: recipient.status,
        ...(isUsingUserAddress && {
          address_verified: unifiedProfile?.address_verified,
          address_verification_method: unifiedProfile?.address_verification_method,
          address_verified_at: unifiedProfile?.address_verified_at,
          address_last_updated: unifiedProfile?.address_last_updated
        })
      };
      
      if (selectedItemId === 'bulk') {
        unassignedItems.forEach(item => {
          assignItemToRecipient(item.product.product_id, recipientAssignment);
        });
        toast.success(`Assigned ${unassignedItems.length} items to ${recipient.name}`);
      } else {
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
    setSelectedItemId('bulk');
    setShowRecipientModal(true);
  };

  const handleAssignAllToMe = () => {
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
        address_verified: unifiedProfile?.address_verified,
        address_verification_method: unifiedProfile?.address_verification_method,
        address_verified_at: unifiedProfile?.address_verified_at,
        address_last_updated: unifiedProfile?.address_last_updated
      };
      
      assignItemToRecipient(item.product.product_id, recipientAssignment);
    });
    
    toast.success(`Assigned ${unassignedItems.length} items to your address`);
  };

  const handlePackageSchedulingUpdate = (groupId: string, scheduledDate: string | null) => {
    updateDeliveryGroupScheduling(groupId, scheduledDate);
    toast.success(scheduledDate ? 'Delivery date scheduled' : 'Delivery timing updated');
  };

  const unassignedItems = getUnassignedItems();
  
  // Check if this is a registry-style wishlist purchase (all items ship to wishlist owner)
  // Primary: items have wishlist_owner_shipping populated
  const hasWishlistOwnerShipping = cartItems.length > 0 && 
    cartItems.every(item => item.wishlist_owner_shipping);
  
  // Fallback: all items have wishlist_id and owner_id, AND buyer is NOT the owner
  const hasWishlistItems = cartItems.length > 0 &&
    cartItems.every(item => item.wishlist_id && item.wishlist_owner_id);
  const buyerIsNotOwner = hasWishlistItems && cartItems[0]?.wishlist_owner_id !== user?.id;
  
  // Combined: wishlist purchase if has shipping, OR if has wishlist items and buyer is not owner
  const isWishlistPurchase = hasWishlistOwnerShipping || (hasWishlistItems && buyerIsNotOwner);
  
  // Debug logging for wishlist purchase detection
  console.log('🎁 [Cart] Wishlist purchase detection:', {
    isWishlistPurchase,
    hasWishlistOwnerShipping,
    hasWishlistItems,
    buyerIsNotOwner,
    cartItemCount: cartItems.length,
    itemsWithOwnerShipping: cartItems.filter(item => item.wishlist_owner_shipping).length,
    firstItemOwnerId: cartItems[0]?.wishlist_owner_id,
    currentUserId: user?.id,
    firstItemOwnerName: cartItems[0]?.wishlist_owner_name,
    firstItemOwnerShipping: cartItems[0]?.wishlist_owner_shipping
  });
  
  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = isWishlistPurchase || (shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode));

  // Get unique recipient names for sidebar summary
  const recipientSummary = deliveryGroups.map(g => ({
    name: g.connectionName,
    count: g.items.length
  }));
  
  // Determine layout: guests use MainLayout (no sidebar), authenticated use SidebarLayout
  const Layout = user ? SidebarLayout : MainLayout;

  return (
    <Layout>
      <ZincMetadataDebugger />
      <div className={cn(
        "container mx-auto px-4 max-w-4xl mobile-container mobile-content-spacing",
        isMobile && cartItems.length > 0 ? "pb-48" : "py-8"
      )}>
        {/* Sticky Header with Backdrop Blur - iOS Style */}
        <div className={cn(
          "flex items-center gap-4 -mx-4 px-4 py-4 mb-4",
          isMobile && "sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              triggerHapticFeedback(HapticPatterns.navigationTap);
              navigate(-1);
            }}
            className="h-11 w-11 touch-target-44"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>Shopping Cart</h1>
            <p className="text-sm text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
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
          <div className={cn(
            "grid gap-4",
            isPhone && "grid-cols-1",
            isTablet && "grid-cols-[1fr_260px]", // Tablet: asymmetric split - items get more space
            !usesMobileShell && "lg:grid-cols-3 gap-6"
          )}>
            {/* Cart Content */}
            <div className={cn(
              isPhone && "order-1",
              isTablet && "col-span-1", // Tablet: items on left
              !usesMobileShell && "lg:col-span-2"
            )}>
              {/* Wishlist Purchase Indicator - Coral-Orange Theme */}
              {isWishlistPurchase && cartItems[0]?.wishlist_owner_name && (
                <div className="mb-4 p-4 bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#FB923C] rounded-lg text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        🎁 Gift for {cartItems[0].wishlist_owner_name}
                      </p>
                      <p className="text-sm text-white/80">
                        Ships directly to their address
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unassigned Items Section - Only show if not a wishlist purchase */}
              {!isWishlistPurchase && (
                <UnassignedItemsSection 
                  unassignedItems={unassignedItems}
                  onAssignAll={handleAssignAllToRecipients}
                  onAssignToMe={handleAssignAllToMe}
                />
              )}

              {/* Package Previews - Collapsed Accordion */}
              {deliveryGroups.length > 0 && (
                <div className="mb-6 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Packages ({deliveryGroups.length})
                  </p>
                  {deliveryGroups.map(group => (
                    <RecipientPackagePreview
                      key={group.id}
                      deliveryGroup={group}
                      cartItems={cartItems}
                      onPackageSchedulingUpdate={handlePackageSchedulingUpdate}
                    />
                  ))}
                </div>
              )}

              {/* Cart Items - Simplified Lululemon Style */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product.product_id} className="bg-background border rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <CartItemImage item={item} size="md" />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.product.name || item.product.title}
                        </h3>
                        
                        {/* Variation details - monochromatic */}
                        {((item.product as any).variationText || (item.product as any).selectedVariations) && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {(item.product as any).variationText || (item.product as any).selectedVariations}
                          </p>
                        )}
                        
                        {/* Price - monochromatic */}
                        <p className="text-lg font-semibold mb-3">
                          {formatPrice(item.product.price, {
                            productSource: item.product.productSource || (item.product.isZincApiProduct ? 'zinc_api' : undefined),
                            skipCentsDetection: item.product.skipCentsDetection
                          })}
                        </p>
                        
                        {/* Quantity Controls - 44px touch targets */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuantityChange(item.product.product_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-11 w-11 quantity-btn-press touch-target-44"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuantityChange(item.product.product_id, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                              className="h-11 w-11 quantity-btn-press touch-target-44"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.product.product_id)}
                            className="h-11 w-11 text-muted-foreground hover:text-destructive touch-target-44"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {/* Inline Recipient Info - Simplified */}
                        <div className="mt-3 pt-3 border-t border-border/50">
                          {item.recipientAssignment ? (
                            <div className="space-y-2">
                              {/* Recipient line - responsive stacking for tablet */}
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                                  <div className="flex items-center gap-2 text-sm min-w-0">
                                    <span className="text-muted-foreground flex-shrink-0">→</span>
                                    <span className="font-medium text-foreground truncate">
                                      {item.recipientAssignment.connectionName}
                                    </span>
                                    {item.recipientAssignment.shippingAddress && (
                                      <span className="text-xs text-muted-foreground truncate hidden xs:inline">
                                        ({item.recipientAssignment.shippingAddress.city}, {item.recipientAssignment.shippingAddress.state})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-5 xs:ml-0">
                                    <button
                                      onClick={() => {
                                        triggerHapticFeedback(HapticPatterns.buttonTap);
                                        handleAssignRecipient(item.product.product_id);
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground underline min-h-[44px] flex items-center px-2"
                                    >
                                      Change
                                    </button>
                                    <span className="text-muted-foreground">|</span>
                                    <button
                                      onClick={() => {
                                        triggerHapticFeedback(HapticPatterns.removeItem);
                                        handleUnassignRecipient(item.product.product_id);
                                      }}
                                      className="text-xs text-muted-foreground hover:text-destructive underline min-h-[44px] flex items-center px-2"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                {/* City/state on mobile only - already inline on wider screens */}
                                {item.recipientAssignment.shippingAddress && (
                                  <span className="text-xs text-muted-foreground ml-5 xs:hidden">
                                    {item.recipientAssignment.shippingAddress.city}, {item.recipientAssignment.shippingAddress.state}
                                  </span>
                                )}
                              </div>
                              
                              {/* Gift message preview */}
                              {item.recipientAssignment.giftMessage && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Gift className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate flex-1 min-w-0">
                                    "{item.recipientAssignment.giftMessage}"
                                  </span>
                                  <button
                                    onClick={() => {
                                      // Will open edit in ItemGiftMessageSection
                                    }}
                                    className="text-xs hover:text-foreground flex-shrink-0"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              
                              {/* Scheduled date */}
                              {item.recipientAssignment.scheduledDeliveryDate && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatScheduledDate(item.recipientAssignment.scheduledDeliveryDate)}</span>
                                </div>
                              )}
                              
                              {/* Collapsed Gift Message Editor */}
                              {!item.recipientAssignment.giftMessage && (
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
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                No recipient assigned
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignRecipient(item.product.product_id)}
                                className="h-8 text-xs"
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary - Desktop AND Tablet (sticky sidebar) */}
            {(isTablet || !usesMobileShell) && (
              <div className={cn(isTablet && "col-span-1")}>
                <div className="bg-background border rounded-lg p-6 sticky top-4">
                  <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    
                    {/* Compact recipient summary - collapse to count on tablet */}
                    {recipientSummary.length > 0 && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Shipping to</span>
                        <span className="text-right text-xs truncate">
                          {recipientSummary.length <= 2 
                            ? recipientSummary.map((r, i) => (
                                <span key={r.name}>
                                  {r.name}{i < recipientSummary.length - 1 ? ', ' : ''}
                                </span>
                              ))
                            : `${recipientSummary.length} recipients`
                          }
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-muted-foreground">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="text-muted-foreground">Calculated at checkout</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-lg font-semibold mb-6">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-sky-500 hover:from-purple-700 hover:via-purple-600 hover:to-sky-600 text-white min-h-[44px]"
                      disabled={!hasCompleteAddress}
                    >
                      {hasCompleteAddress ? 'Proceed to Checkout' : 'Add Shipping Address'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        triggerHapticFeedback(HapticPatterns.navigationTap);
                        navigate("/marketplace");
                      }}
                      className="w-full min-h-[44px]"
                    >
                      Continue Shopping
                    </Button>
                    
                    {cartItems.length > 0 && (
                      <button
                        onClick={() => {
                          triggerHapticFeedback(HapticPatterns.removeItem);
                          clearCart();
                        }}
                        className="w-full text-xs text-muted-foreground hover:text-destructive py-2 min-h-[44px]"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Phone-Only Summary Card - Compact (Tablets get sidebar instead) */}
            {isPhone && (
              <div className="order-2 bg-muted/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                {recipientSummary.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Shipping to: {recipientSummary.map(r => r.name).join(', ')}
                  </p>
                )}
              </div>
            )}
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
        
        {/* Sticky Bottom CTA Bar - Phone Only (Tablets have sidebar summary) */}
        {isPhone && cartItems.length > 0 && (
          <div 
            className="fixed left-0 right-0 bg-background/95 backdrop-blur-xl border-t z-40"
            style={{ bottom: user ? 'calc(env(safe-area-inset-bottom, 0px) + 64px)' : 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{formatPrice(cartTotal)}</p>
              </div>
              <Button 
                onClick={handleCheckout}
                className="flex-1 max-w-[200px] bg-gradient-to-r from-purple-600 via-purple-500 to-sky-500 hover:from-purple-700 hover:via-purple-600 hover:to-sky-600 text-white h-12"
                disabled={!isWishlistPurchase && user ? !hasCompleteAddress : false}
              >
                {isWishlistPurchase ? 'Checkout' : (user ? (hasCompleteAddress ? 'Checkout' : 'Add Address') : 'Checkout')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
