/**
 * ================================
 * LocationBasedCheckout Component
 * ================================
 * 
 * Enhanced checkout component that integrates UnifiedLocationService 
 * with UnifiedPaymentService for intelligent shipping optimization.
 * 
 * FEATURES:
 * - Real-time shipping cost calculation based on location
 * - Multiple shipping options with delivery estimates
 * - Address validation and delivery zone checking
 * - Dynamic shipping costs based on distance
 * - Integration with existing payment flow
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { unifiedLocationService, ShippingOption, ShippingOptimization } from '@/services/location/UnifiedLocationService';
import { useUnifiedCart } from '@/hooks/useUnifiedPayment';
import AddressAutoComplete from './AddressAutoComplete';
import { StandardizedAddress } from '@/services/googlePlacesService';

interface LocationBasedCheckoutProps {
  onShippingUpdate?: (cost: number, option: ShippingOption) => void;
  className?: string;
}

const LocationBasedCheckout: React.FC<LocationBasedCheckoutProps> = ({
  onShippingUpdate,
  className
}) => {
  const [shippingAddress, setShippingAddress] = useState<StandardizedAddress | null>(null);
  const [addressValid, setAddressValid] = useState(false);
  const [shippingOptimization, setShippingOptimization] = useState<ShippingOptimization | null>(null);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const { cartItems, cartTotal } = useUnifiedCart();

  useEffect(() => {
    if (shippingAddress && addressValid) {
      calculateShipping();
    }
  }, [shippingAddress, addressValid]);

  const handleAddressSelect = async (address: StandardizedAddress) => {
    console.log('🌍 [LocationBasedCheckout] Address selected:', address);
    setShippingAddress(address);
    
    // Validate address for delivery
    const validation = await unifiedLocationService.validateAddressForDelivery(address);
    setValidationResult(validation);
    setAddressValid(validation.isValid);
    
    if (!validation.isValid) {
      console.warn('🌍 [LocationBasedCheckout] Address validation failed:', validation.issues);
    }
  };

  const calculateShipping = async () => {
    if (!shippingAddress) return;
    
    setIsCalculating(true);
    console.log('🌍 [LocationBasedCheckout] Calculating shipping for:', shippingAddress);
    
    try {
      // Use UnifiedLocationService for shipping optimization
      const optimization = await unifiedLocationService.getShippingOptimization(shippingAddress);
      
      if (optimization) {
        setShippingOptimization(optimization);
        
        // Auto-select the standard shipping option
        const standardOption = optimization.options.find(opt => opt.id === 'standard');
        if (standardOption) {
          setSelectedShippingOption(standardOption);
          onShippingUpdate?.(standardOption.cost, standardOption);
        }
      }
    } catch (error) {
      console.error('🌍 [LocationBasedCheckout] Shipping calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleShippingOptionSelect = (option: ShippingOption) => {
    setSelectedShippingOption(option);
    onShippingUpdate?.(option.cost, option);
    console.log('🌍 [LocationBasedCheckout] Shipping option selected:', option);
  };

  const formatDeliveryTime = (minutes: number): string => {
    const days = Math.ceil(minutes / 1440);
    if (days === 1) return '1 business day';
    return `${days} business days`;
  };

  const getValidationBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Address Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddressAutoComplete
            value=""
            onChange={() => {}} // Address selection handled by onAddressSelect
            onAddressSelect={handleAddressSelect}
            label="Enter shipping address"
            placeholder="Start typing your address..."
            showValidation={true}
          />
          
          {validationResult && (
            <div className="flex items-center gap-2">
              <Badge className={getValidationBadgeColor(validationResult.confidence)}>
                {validationResult.confidence} confidence
              </Badge>
              {validationResult.deliveryZone && (
                <Badge variant="outline">
                  Zone: {validationResult.deliveryZone}
                </Badge>
              )}
            </div>
          )}
          
          {validationResult?.issues.length > 0 && (
            <div className="text-sm text-destructive">
              <ul className="list-disc list-inside">
                {validationResult.issues.map((issue: string, index: number) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResult?.suggestions.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Suggestions:</p>
              <ul className="list-disc list-inside">
                {validationResult.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Options */}
      {shippingOptimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Options
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Distance: {shippingOptimization.distance} miles
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCalculating ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse">Calculating shipping costs...</div>
              </div>
            ) : (
              shippingOptimization.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-all',
                    selectedShippingOption?.id === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => handleShippingOptionSelect(option)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatDeliveryTime(option.timeMinutes)}
                      </div>
                      {option.carrier && (
                        <div className="text-sm text-muted-foreground">
                          via {option.carrier}
                        </div>
                      )}
                      {option.trackingAvailable && (
                        <Badge variant="secondary" className="text-xs">
                          Tracking included
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-4 w-4" />
                        {option.cost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      {cartItems.length > 0 && selectedShippingOption && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Items ({cartItems.length})</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping ({selectedShippingOption.name})</span>
              <span>${selectedShippingOption.cost.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${(cartTotal + selectedShippingOption.cost).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && shippingOptimization && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug: Location Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>From: {shippingOptimization.fromLocation.lat.toFixed(4)}, {shippingOptimization.fromLocation.lng.toFixed(4)}</div>
            <div>To: {shippingOptimization.toLocation.lat.toFixed(4)}, {shippingOptimization.toLocation.lng.toFixed(4)}</div>
            <div>Estimated Time: {shippingOptimization.estimatedTime} minutes</div>
            <div>Base Cost: ${shippingOptimization.cost.toFixed(2)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationBasedCheckout;