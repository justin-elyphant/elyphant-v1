import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Users, Package, User, AlertCircle, Edit, ChevronDown, ChevronUp, MessageSquare, Info, Gift, CheckCircle2 } from 'lucide-react';
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
  onUpdateShippingInfo?: (data: Record<string, string>) => void;
  checkoutShippingInfo?: {
    name: string;
    address: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const CheckoutShippingReview: React.FC<CheckoutShippingReviewProps> = ({
  shippingCost,
  isWishlistPurchase = false,
  wishlistOwnerInfo = null,
  onUpdateShippingInfo,
  checkoutShippingInfo
}) => {
  const navigate = useNavigate();
  const { cartItems, deliveryGroups, getUnassignedItems, updateRecipientAssignment } = useCart();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { profile: unifiedProfile } = useUnifiedProfile();
  const unassignedItems = getUnassignedItems();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingGuestAddress, setIsEditingGuestAddress] = useState(true);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  
  // Check if user has a complete address from their profile
  const shippingAddress = profile?.shipping_address;
  const hasCompleteProfileAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  // Check if guest has entered a complete address via the inline form
  const hasCompleteGuestAddress = checkoutShippingInfo &&
    checkoutShippingInfo.name?.trim() &&
    checkoutShippingInfo.address?.trim() &&
    checkoutShippingInfo.city?.trim() &&
    checkoutShippingInfo.state?.trim() &&
    checkoutShippingInfo.zipCode?.trim();

  const hasCompleteAddress = hasCompleteProfileAddress || hasCompleteGuestAddress;

  // For wishlist purchases, shipping is always complete (uses owner's address)
  const hasIncompleteShipping = !isWishlistPurchase && !hasCompleteAddress && unassignedItems.length > 0;

  // Determine if we need the inline address form (guest or logged-in user without saved address)
  const needsInlineAddressForm = !isWishlistPurchase && !hasCompleteProfileAddress && onUpdateShippingInfo;

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

  const validateGuestAddress = () => {
    const errors: Record<string, string> = {};
    if (!checkoutShippingInfo?.name?.trim()) errors.name = 'Full name is required';
    if (!checkoutShippingInfo?.address?.trim()) errors.address = 'Street address is required';
    if (!checkoutShippingInfo?.city?.trim()) errors.city = 'City is required';
    if (!checkoutShippingInfo?.state?.trim()) errors.state = 'State is required';
    if (!checkoutShippingInfo?.zipCode?.trim()) errors.zipCode = 'ZIP code is required';
    else if (!/^\d{5}(-\d{4})?$/.test(checkoutShippingInfo.zipCode.trim())) errors.zipCode = 'Invalid ZIP code';
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGuestAddressConfirm = () => {
    if (validateGuestAddress()) {
      setIsEditingGuestAddress(false);
    }
  };

  const handleGuestFieldChange = (field: string, value: string) => {
    if (onUpdateShippingInfo) {
      onUpdateShippingInfo({ [field]: value });
    }
    if (addressErrors[field]) {
      setAddressErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Inline guest address form
  const renderInlineAddressForm = () => {
    if (!needsInlineAddressForm) return null;

    // If address is confirmed, show summary
    if (hasCompleteGuestAddress && !isEditingGuestAddress) {
      return (
        <div className="w-full p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-start gap-3 w-full">
            <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <p className="font-medium text-foreground">Shipping Address</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGuestAddress(true)}
                  className="h-8 px-2 text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
                >
                  Edit
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{checkoutShippingInfo?.name}</p>
                <p>{checkoutShippingInfo?.address}</p>
                {checkoutShippingInfo?.addressLine2 && <p>{checkoutShippingInfo.addressLine2}</p>}
                <p>{checkoutShippingInfo?.city}, {checkoutShippingInfo?.state} {checkoutShippingInfo?.zipCode}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show the address entry form
    return (
      <div className="w-full p-4 bg-muted/30 rounded-lg border border-border space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium text-sm">Enter Shipping Address</p>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="guest-name" className="text-sm">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="guest-name"
              placeholder="Jane Doe"
              value={checkoutShippingInfo?.name || ''}
              onChange={(e) => handleGuestFieldChange('name', e.target.value)}
              className={`mt-1 ${addressErrors.name ? 'border-destructive' : ''}`}
            />
            {addressErrors.name && <p className="text-xs text-destructive mt-1">{addressErrors.name}</p>}
          </div>

          <div>
            <Label htmlFor="guest-address" className="text-sm">Street Address <span className="text-destructive">*</span></Label>
            <Input
              id="guest-address"
              placeholder="123 Main St"
              value={checkoutShippingInfo?.address || ''}
              onChange={(e) => handleGuestFieldChange('address', e.target.value)}
              className={`mt-1 ${addressErrors.address ? 'border-destructive' : ''}`}
            />
            {addressErrors.address && <p className="text-xs text-destructive mt-1">{addressErrors.address}</p>}
          </div>

          <div>
            <Label htmlFor="guest-address2" className="text-sm">Apt, Suite, etc. <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="guest-address2"
              placeholder="Apt 4B"
              value={checkoutShippingInfo?.addressLine2 || ''}
              onChange={(e) => handleGuestFieldChange('addressLine2', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="guest-city" className="text-sm">City <span className="text-destructive">*</span></Label>
              <Input
                id="guest-city"
                placeholder="New York"
                value={checkoutShippingInfo?.city || ''}
                onChange={(e) => handleGuestFieldChange('city', e.target.value)}
                className={`mt-1 ${addressErrors.city ? 'border-destructive' : ''}`}
              />
              {addressErrors.city && <p className="text-xs text-destructive mt-1">{addressErrors.city}</p>}
            </div>
            <div>
              <Label htmlFor="guest-state" className="text-sm">State <span className="text-destructive">*</span></Label>
              <Input
                id="guest-state"
                placeholder="NY"
                value={checkoutShippingInfo?.state || ''}
                onChange={(e) => handleGuestFieldChange('state', e.target.value)}
                className={`mt-1 ${addressErrors.state ? 'border-destructive' : ''}`}
              />
              {addressErrors.state && <p className="text-xs text-destructive mt-1">{addressErrors.state}</p>}
            </div>
            <div>
              <Label htmlFor="guest-zip" className="text-sm">ZIP <span className="text-destructive">*</span></Label>
              <Input
                id="guest-zip"
                placeholder="10001"
                value={checkoutShippingInfo?.zipCode || ''}
                onChange={(e) => handleGuestFieldChange('zipCode', e.target.value)}
                className={`mt-1 ${addressErrors.zipCode ? 'border-destructive' : ''}`}
              />
              {addressErrors.zipCode && <p className="text-xs text-destructive mt-1">{addressErrors.zipCode}</p>}
            </div>
          </div>

          <Button
            onClick={handleGuestAddressConfirm}
            className="w-full mt-2"
            size="sm"
          >
            Confirm Address
          </Button>
        </div>
      </div>
    );
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
            {hasCompleteProfileAddress && (
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
                <span>Edit</span>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {/* Mobile: Collapsible content */}
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Registry-style Wishlist Purchase Banner - Coral-Orange Theme */}
            {isWishlistPurchase && wishlistOwnerInfo && (() => {
              const shipping = wishlistOwnerInfo.shipping || {};
              const city = shipping.city || '';
              const state = shipping.state || '';
              const locationHint = city && state ? `${city}, ${state}` : city || state || '';
              
              return (
                <div className="w-full p-4 bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#FB923C] rounded-lg text-white">
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 bg-white/20 rounded-full flex-shrink-0 backdrop-blur-sm">
                      <Gift className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">
                        Shipping to {wishlistOwnerInfo.name}'s address
                      </p>
                      {locationHint && (
                        <p className="text-sm text-white/80 mt-1">
                          📍 {locationHint}
                        </p>
                      )}
                      <p className="text-xs text-white/60 mt-2">
                        🔒 Their full address is kept private for security
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* Show incomplete shipping alert ONLY for authenticated users without address */}
            {hasIncompleteShipping && !needsInlineAddressForm && (
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

            {/* Inline Address Form for guests / users without saved address */}
            {renderInlineAddressForm()}

            {/* Gift Recipients (Delivery Groups) - Hide for wishlist purchases */}
            {!isWishlistPurchase && deliveryGroups.map((group) => {
              console.log(`🔍 [CheckoutShippingReview] Rendering group ${group.connectionName}:`, {
                address_verified: group.address_verified,
                verification_method: group.address_verification_method,
                verified_at: group.address_verified_at
              });
              
              return (
                <div key={group.id} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 w-full">
                    <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-medium text-foreground truncate flex-1">{group.connectionName}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            {group.items.length}
                          </Badge>
                        </div>
                      </div>
                      
                      {group.shippingAddress && (
                        <div className="text-sm text-muted-foreground mb-2">
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
                                  <p className="text-muted-foreground">
                                    {group.shippingAddress.city}, {group.shippingAddress.state}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    🔒 Full address securely stored for delivery
                                  </p>
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
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Gift Message:</p>
                              <p className="text-sm text-foreground italic">"{group.giftMessage}"</p>
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
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Scheduled Delivery:</p>
                              <p className="text-sm text-foreground font-medium">
                                {formatScheduledDate(group.scheduledDeliveryDate)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 italic">
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
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-1 h-auto p-1">
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

            {/* Your Address (Unassigned Items) - Hide for wishlist purchases, hide if guest form handles it */}
            {!isWishlistPurchase && !needsInlineAddressForm && unassignedItems.length > 0 && (
              <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 w-full">
                  <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="font-medium text-foreground truncate flex-1">Your Address</p>
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs flex-shrink-0">
                        <Package className="h-3 w-3 mr-1" />
                        {unassignedItems.length}
                      </Badge>
                    </div>
                    
                    {hasCompleteAddress && shippingAddress ? (
                      <div className="text-sm text-muted-foreground">
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
