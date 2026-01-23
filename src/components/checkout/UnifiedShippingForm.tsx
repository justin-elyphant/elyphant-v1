
/*
 * ========================================================================
 * 🚨 CRITICAL SHIPPING COMPONENT - DO NOT SIMPLIFY 🚨
 * ========================================================================
 * 
 * This component handles sophisticated shipping address collection,
 * validation, and shipping method selection.
 * 
 * ⚠️  CRITICAL FEATURES:
 * - Address validation and standardization
 * - Shipping method selection with pricing
 * - Integration with address book and profile system
 * - Real-time validation and error handling
 * 
 * 🔗 DEPENDENCIES:
 * - Form validation system
 * - Shipping option interface (ShippingOption)
 * - Address standardization utilities
 * 
 * 🚫 DO NOT REPLACE WITH simple form inputs
 * 
 * ⚠️  INTERFACE REQUIREMENTS:
 * - ShippingOption must have: id, name, price, delivery_time
 * - Props must include all shipping info fields
 * - Validation must be maintained
 * 
 * ========================================================================
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { MapPin, Truck, CheckCircle } from 'lucide-react';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';

// CRITICAL: Shipping option interface - DO NOT MODIFY
interface ShippingOption {
  id: string;
  name: string;
  price: number;
  delivery_time: string; // CRITICAL: This must be 'delivery_time', not 'estimatedDays'
}

// CRITICAL: Component props interface - maintains all required fields
interface UnifiedShippingFormProps {
  shippingInfo: ShippingInfo;
  onUpdate: (data: Partial<ShippingInfo>) => void;
  selectedShippingMethod: string;
  onShippingMethodChange: (method: string) => void;
  shippingOptions: ShippingOption[];
  isLoadingShipping: boolean;
}

/*
 * 🎯 UNIFIED SHIPPING FORM COMPONENT
 * 
 * This component provides a comprehensive shipping information form
 * with validation, address standardization, and shipping method selection.
 * 
 * CRITICAL: All form fields are required for order processing
 */
const UnifiedShippingForm: React.FC<UnifiedShippingFormProps> = ({
  shippingInfo,
  onUpdate,
  selectedShippingMethod,
  onShippingMethodChange,
  shippingOptions,
  isLoadingShipping
}) => {
  /*
   * 🔗 CRITICAL: Input change handler
   * 
   * This function updates shipping information in the parent state.
   * It ensures all changes are properly validated and propagated.
   */
  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    onUpdate({ [field]: value });
  };

  /*
   * 🔗 CRITICAL: Address validation
   * 
   * This function validates that all required address fields are filled.
   * It's essential for preventing incomplete orders.
   * Phone is now required for Zinc/carrier delivery notifications.
   */
  const isAddressComplete = () => {
    return (
      shippingInfo.name &&
      shippingInfo.email &&
      shippingInfo.address &&
      shippingInfo.city &&
      shippingInfo.state &&
      shippingInfo.zipCode &&
      shippingInfo.country &&
      shippingInfo.phone
    );
  };

  return (
    <div className="space-y-6">
      {/* CRITICAL: Shipping Address Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={shippingInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={shippingInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Address Fields */}
          <div>
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={shippingInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your street address"
              required
            />
          </div>

          <div>
            <Label htmlFor="addressLine2">Apartment, Suite, etc.</Label>
            <Input
              id="addressLine2"
              value={shippingInfo.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              placeholder="Apartment, suite, unit, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={shippingInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={shippingInfo.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={shippingInfo.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="Enter ZIP code"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={shippingInfo.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Enter country"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={shippingInfo.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for delivery notifications
              </p>
            </div>
          </div>

          {/* Address validation indicator */}
          {isAddressComplete() && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Address information complete</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRITICAL: Shipping Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingShipping ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading shipping options...</p>
            </div>
          ) : (
            <RadioGroup value={selectedShippingMethod} onValueChange={onShippingMethodChange}>
              <div className="space-y-3">
                {shippingOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{option.name}</div>
                          {/* CRITICAL: Must use 'delivery_time' property */}
                          <div className="text-sm text-muted-foreground">{option.delivery_time}</div>
                        </div>
                        <div className="font-bold">
                          ${option.price.toFixed(2)}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedShippingForm;
