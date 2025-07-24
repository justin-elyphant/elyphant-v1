/**
 * ================================
 * LocationBasedCheckout Component (Simplified)
 * ================================
 * 
 * Simplified checkout component focused on address validation only.
 * Uses fixed $6.99 shipping rate from checkout system.
 * 
 * FEATURES:
 * - Address validation using UnifiedLocationService
 * - Google Places autocomplete
 * - Basic delivery validation
 * - Fixed shipping cost (handled by checkout system)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { unifiedLocationService, AddressValidationResult } from '@/services/location/UnifiedLocationService';
import AddressAutoComplete from './AddressAutoComplete';
import { StandardizedAddress } from '@/services/googlePlacesService';

interface LocationBasedCheckoutProps {
  onAddressValidated?: (address: StandardizedAddress, isValid: boolean) => void;
  className?: string;
}

const LocationBasedCheckout: React.FC<LocationBasedCheckoutProps> = ({
  onAddressValidated,
  className
}) => {
  const [shippingAddress, setShippingAddress] = useState<StandardizedAddress | null>(null);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleAddressSelect = async (address: StandardizedAddress) => {
    console.log('🌍 [LocationBasedCheckout] Address selected:', address);
    setShippingAddress(address);
    setIsValidating(true);
    
    try {
      // Validate address for delivery
      const validation = await unifiedLocationService.validateAddressForDelivery(address);
      setValidationResult(validation);
      
      // Notify parent component
      onAddressValidated?.(address, validation.isValid);
      
      if (!validation.isValid) {
        console.warn('🌍 [LocationBasedCheckout] Address validation failed:', validation.issues);
      }
    } catch (error) {
      console.error('🌍 [LocationBasedCheckout] Address validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getValidationIcon = (isValid: boolean, confidence?: string) => {
    if (isValid && confidence === 'high') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Address Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address Validation
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
          
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-pulse">Validating address...</div>
            </div>
          )}
          
          {validationResult && shippingAddress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getValidationIcon(validationResult.isValid, validationResult.confidence)}
                <Badge className={getValidationBadgeColor(validationResult.confidence)}>
                  {validationResult.confidence} confidence
                </Badge>
                {validationResult.isValid ? (
                  <Badge className="bg-green-100 text-green-800">
                    Valid for delivery
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    Delivery issues found
                  </Badge>
                )}
              </div>

              {validationResult.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Issues Found:</h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationResult.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.suggestions.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Suggestions:</h4>
                  <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                    {validationResult.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.isValid && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Address validated successfully
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    This address can receive deliveries. Shipping cost: $6.99
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && shippingAddress && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug: Address Data</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>Formatted: {shippingAddress.formatted_address}</div>
            <div>Street: {shippingAddress.street}</div>
            <div>City: {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</div>
            <div>Country: {shippingAddress.country}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationBasedCheckout;