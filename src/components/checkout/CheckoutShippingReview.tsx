import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Users, Package, User, AlertCircle, Edit, ChevronDown, ChevronUp, MessageSquare, Info, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { useAuth } from '@/contexts/auth';
import QuickEditModal from './QuickEditModal';
import AddressVerificationBadge from '@/components/ui/AddressVerificationBadge';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { unifiedPaymentService } from '@/services/payment/UnifiedPaymentService';
import { formatScheduledDate } from '@/utils/dateUtils';

interface CheckoutShippingReviewProps {
  shippingCost: number | null;
  isWishlistPurchase?: boolean;
  wishlistOwnerInfo?: { name: string; id: string; shipping: any } | null;
}

const CheckoutShippingReview: React.FC<CheckoutShippingReviewProps> = ({
  shippingCost,
  isWishlistPurchase = false,
  wishlistOwnerInfo = null
}) => {
  const navigate = useNavigate();
  const { cartItems, deliveryGroups, getUnassignedItems, updateRecipientAssignment } = useCart();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { profile: unifiedProfile } = useUnifiedProfile();
  const unassignedItems = getUnassignedItems();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if user has a complete address
  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  // For wishlist purchases, shipping is always complete (uses owner's address)
  // Only show incomplete shipping warning for non-wishlist purchases with unassigned items
  const hasIncompleteShipping = !isWishlistPurchase && !hasCompleteAddress && unassignedItems.length > 0;

  // For wishlist purchases, count as 1 destination (owner)
  const totalDestinations = isWishlistPurchase 
    ? 1 
    : deliveryGroups.length + (unassignedItems.length > 0 ? 1 : 0);

  // Quick edit handlers
  const handleAddressEdit = async (groupId: string, newAddress: any) => {
    const group = deliveryGroups.find(g => g.id === groupId);
    if (group) {
      group.items.forEach(productId => {
        updateRecipientAssignment(productId, {
          shippingAddress: newAddress
        });
      });
    }
  };

  const handleMessageEdit = async (groupId: string, newMessage: string) => {
    const group = deliveryGroups.find(g => g.id === groupId);
    if (group) {
      group.items.forEach(productId => {
        updateRecipientAssignment(productId, {
          giftMessage: newMessage
        });
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Shipping</span>
            <span className="text-sm font-normal text-muted-foreground">
              {totalDestinations} destination{totalDestinations > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile: Collapsible toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="sm:hidden h-11 w-11 touch-target-44"
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                console.log('🔄 [CheckoutShippingReview] Flushing cart before Edit in Cart navigation');
                await unifiedPaymentService.flushPendingSaves();
                navigate('/cart');
              }}
              className="flex items-center gap-1 h-11 px-3 touch-target-44 underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              <span className="hidden sm:inline">Edit</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {/* Mobile: Collapsible content */}
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Registry-style Wishlist Purchase Banner */}
            {isWishlistPurchase && wishlistOwnerInfo && (
              <div className="w-full p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                    <Gift className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-purple-800">
                      Shipping to {wishlistOwnerInfo.name}'s address
                    </p>
                    {wishlistOwnerInfo.shipping && (
                      <div className="text-sm text-purple-700 mt-1">
                        <p>{wishlistOwnerInfo.shipping.city}, {wishlistOwnerInfo.shipping.state}</p>
                        <p className="text-xs text-purple-600 mt-1">
                          Gift will be delivered directly to the wishlist owner
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {hasIncompleteShipping && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Shipping setup is incomplete. Please{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-destructive underline"
                    onClick={async (e) => {
                      e.preventDefault();
                      console.log('🔄 [CheckoutShippingReview] Flushing cart before incomplete alert navigation');
                      await unifiedPaymentService.flushPendingSaves();
                      navigate('/cart');
                    }}
                  >
                    return to cart
                  </Button>
                  {' '}to configure your shipping address.
                </AlertDescription>
              </Alert>
            )}

            {/* Gift Recipients (Delivery Groups) - Hide for wishlist purchases */}
            {!isWishlistPurchase && deliveryGroups.map((group) => {
              console.log(`🔍 [CheckoutShippingReview] Rendering group ${group.connectionName}:`, {
                address_verified: group.address_verified,
                verification_method: group.address_verification_method,
                verified_at: group.address_verified_at
              });
              
              return (
                <div key={group.id} className="w-full p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-medium text-green-800 truncate flex-1">{group.connectionName}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            {group.items.length}
                          </Badge>
                        </div>
                      </div>
                      
                      {group.shippingAddress && (
                        <div className="text-sm text-green-700 mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {group.isPrivateAddress ? (
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium flex items-center gap-2">
                                      <span className="truncate">{group.connectionName}</span>
                                      <AddressVerificationBadge
                                        verified={group.address_verified ?? unifiedProfile?.address_verified}
                                        verificationMethod={group.address_verification_method ?? unifiedProfile?.address_verification_method}
                                        verifiedAt={group.address_verified_at ?? unifiedProfile?.address_verified_at}
                                        lastUpdated={group.address_verified_at ?? unifiedProfile?.address_verified_at}
                                        size="sm"
                                        showText={false}
                                      />
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-blue-500 cursor-help flex-shrink-0" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p>
                                              {group.connectionName} has independently verified their address. 
                                              Full details will be shared with our delivery partner when you complete your order.
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </p>
                                    <p className="text-muted-foreground truncate">
                                      {group.shippingAddress.city}, {group.shippingAddress.state}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="min-w-0">
                                  <p className="font-medium flex items-center gap-2">
                                    <span className="truncate">{group.shippingAddress.name}</span>
                                    <AddressVerificationBadge
                                      verified={group.address_verified ?? unifiedProfile?.address_verified}
                                      verificationMethod={group.address_verification_method ?? unifiedProfile?.address_verification_method}
                                      verifiedAt={group.address_verified_at ?? unifiedProfile?.address_verified_at}
                                      lastUpdated={group.address_verified_at ?? unifiedProfile?.address_verified_at}
                                      size="sm"
                                      showText={false}
                                    />
                                  </p>
                                  <p className="break-words">{group.shippingAddress.address}</p>
                                  <p className="break-words">{group.shippingAddress.city}, {group.shippingAddress.state} {group.shippingAddress.zipCode}</p>
                                </div>
                              )}
                            </div>
                            <QuickEditModal
                              type="address"
                              deliveryGroupId={group.id}
                              currentData={group.shippingAddress}
                              onSave={(newAddress) => handleAddressEdit(group.id, newAddress)}
                            >
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </QuickEditModal>
                          </div>
                        </div>
                      )}
                      
                      {group.giftMessage && (
                        <div className="mt-2 p-2 bg-white rounded border border-green-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-green-600 font-medium mb-1">Gift Message:</p>
                              <p className="text-sm text-green-800 italic">"{group.giftMessage}"</p>
                            </div>
                            <QuickEditModal
                              type="message"
                              deliveryGroupId={group.id}
                              currentData={{ message: group.giftMessage }}
                              onSave={(data) => handleMessageEdit(group.id, data.message)}
                            >
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </QuickEditModal>
                          </div>
                        </div>
                      )}

                      {group.scheduledDeliveryDate && (
                        <div className="mt-2 p-2 bg-white rounded border border-green-200">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-green-600 font-medium mb-1">Scheduled Delivery:</p>
                              <p className="text-sm text-green-800 font-medium">
                                {formatScheduledDate(group.scheduledDeliveryDate)}
                              </p>
                              <p className="text-xs text-green-600 mt-1 italic">
                                📅 Will be processed 4 days before delivery date to ensure on-time arrival
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {!group.giftMessage && (
                        <QuickEditModal
                          type="message"
                          deliveryGroupId={group.id}
                          currentData={{ message: '' }}
                          onSave={(data) => handleMessageEdit(group.id, data.message)}
                        >
                          <Button variant="ghost" size="sm" className="text-xs text-green-600 mt-1 h-auto p-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Add gift message
                          </Button>
                        </QuickEditModal>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Your Address (Unassigned Items) - Hide for wishlist purchases */}
            {!isWishlistPurchase && unassignedItems.length > 0 && (
              <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="font-medium text-blue-800 truncate flex-1">Your Address</p>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs flex-shrink-0">
                        <Package className="h-3 w-3 mr-1" />
                        {unassignedItems.length}
                      </Badge>
                    </div>
                    
                    {hasCompleteAddress && shippingAddress ? (
                      <div className="text-sm text-blue-700">
                        <p className="font-medium flex items-center gap-2">
                          <span className="truncate">{profile?.name}</span>
                          <AddressVerificationBadge
                            verified={unifiedProfile?.address_verified}
                            verificationMethod={unifiedProfile?.address_verification_method}
                            verifiedAt={unifiedProfile?.address_verified_at}
                            lastUpdated={unifiedProfile?.address_last_updated}
                            size="sm"
                            showText={false}
                          />
                        </p>
                        <p className="break-words">{shippingAddress.address_line1 || shippingAddress.street}</p>
                        {shippingAddress.address_line2 && (
                          <p className="break-words">{shippingAddress.address_line2}</p>
                        )}
                        <p className="break-words">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code || shippingAddress.zipCode}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600">
                        <p className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">No shipping address configured</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Cost Summary */}
            {totalDestinations > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Shipping ({totalDestinations} destination{totalDestinations > 1 ? 's' : ''})
                  </span>
                  <span className="font-medium">
                    {shippingCost === null ? 'Calculating...' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {/* No shipping needed */}
            {totalDestinations === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No items to ship</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CheckoutShippingReview;
