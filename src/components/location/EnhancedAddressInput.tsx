/**
 * ================================
 * EnhancedAddressInput Component
 * ================================
 * 
 * Advanced address input component that leverages UnifiedLocationService
 * for enhanced address autocomplete, validation, and location intelligence.
 * 
 * FEATURES:
 * - Enhanced Google Places autocomplete
 * - Real-time address validation
 * - Delivery zone verification
 * - Location intelligence insights
 * - Shipping optimization preview
 * 
 * INTEGRATION:
 * - Uses UnifiedLocationService for all location operations
 * - Maintains compatibility with existing address components
 * - Provides enhanced UX with location intelligence
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Clock, 
  Truck, 
  Search,
  X
} from 'lucide-react';
import { 
  useEnhancedAddressAutocomplete, 
  useAddressValidation,
  useShippingOptimization 
} from '@/hooks/useUnifiedLocation';
import { EnhancedAddress } from '@/services/location/UnifiedLocationService';
import { StandardizedAddress } from '@/services/googlePlacesService';

// ================================
// Component Props
// ================================

interface EnhancedAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: EnhancedAddress) => void;
  onValidationChange?: (isValid: boolean, validationData?: any) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  showValidation?: boolean;
  showShippingPreview?: boolean;
  showLocationIntelligence?: boolean;
  options?: {
    preferBusiness?: boolean;
    includeCoordinates?: boolean;
    filterByDelivery?: boolean;
  };
}

// ================================
// Enhanced Address Input Component
// ================================

export const EnhancedAddressInput: React.FC<EnhancedAddressInputProps> = ({
  value,
  onChange,
  onAddressSelect,
  onValidationChange,
  placeholder = "Start typing your address...",
  label = "Address",
  required = false,
  showValidation = true,
  showShippingPreview = false,
  showLocationIntelligence = false,
  options
}) => {
  const [open, setOpen] = useState(false);
  const [shouldValidate, setShouldValidate] = useState(false);

  // Enhanced autocomplete hook
  const {
    query,
    setQuery,
    predictions,
    isLoading,
    selectedAddress,
    selectPrediction,
    clearSelection
  } = useEnhancedAddressAutocomplete({
    onAddressSelect: (address) => {
      onAddressSelect?.(address);
      setShouldValidate(true);
    },
    options
  });

  // Address validation hook
  const {
    validateAddress,
    clearValidation,
    isValidating,
    validationResult
  } = useAddressValidation();

  // Shipping optimization hook
  const {
    getShippingOptimization,
    shippingData,
    isCalculating: isCalculatingShipping
  } = useShippingOptimization();

  // Sync external value with internal query
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value, setQuery]);

  // Sync validation changes
  useEffect(() => {
    if (validationResult && onValidationChange) {
      onValidationChange(validationResult.isValid, validationResult);
    }
  }, [validationResult, onValidationChange]);

  // Auto-validate when address is selected
  useEffect(() => {
    if (shouldValidate && selectedAddress) {
      validateAddress(selectedAddress);
      
      if (showShippingPreview) {
        getShippingOptimization(selectedAddress);
      }
      
      setShouldValidate(false);
    }
  }, [shouldValidate, selectedAddress, validateAddress, getShippingOptimization, showShippingPreview]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    clearValidation();
    
    // Close popover if input is too short
    if (newValue.length < 3) {
      setOpen(false);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: any) => {
    await selectPrediction(prediction);
    setOpen(false);
  };

  // Handle input click/focus
  const handleInputClick = () => {
    if (query.length >= 3) {
      setOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (query.length >= 3) {
      setOpen(true);
    }
  };

  // Handle popover open change
  const handlePopoverOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    clearSelection();
    clearValidation();
    onChange('');
    setOpen(false);
  };

  // Get validation styling
  const getValidationStyling = () => {
    if (!validationResult) return '';
    
    switch (validationResult.confidence) {
      case 'high': return 'border-success';
      case 'medium': return 'border-warning';
      case 'low': return 'border-destructive';
      default: return '';
    }
  };

  const getValidationIcon = () => {
    if (isValidating) return <Search className="h-4 w-4 animate-spin" />;
    if (!validationResult) return null;
    
    return validationResult.isValid ? 
      <CheckCircle className="h-4 w-4 text-success" /> :
      <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  // Render prediction item
  const renderPrediction = (prediction: any) => (
    <div
      key={prediction.place_id}
      className="flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-accent rounded-md"
      onClick={() => handlePredictionSelect(prediction)}
    >
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {prediction.structured_formatting.main_text}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {prediction.structured_formatting.secondary_text}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Main Input Field */}
      <div className="grid gap-2">
        {label && (
          <Label htmlFor="enhanced-address" className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <Popover open={open} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                id="enhanced-address"
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onClick={handleInputClick}
                onFocus={handleInputFocus}
                className={`pr-20 ${getValidationStyling()}`}
                autoComplete="address-line1"
              />
              
              {/* Input Icons */}
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                {getValidationIcon()}
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleClear}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </PopoverTrigger>
          
          <PopoverContent className="w-full p-0" align="start">
            <div className="max-h-60 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Search className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Searching addresses...</span>
                </div>
              ) : predictions.length > 0 ? (
                <div className="py-2">
                  {predictions.map(renderPrediction)}
                </div>
              ) : query.length >= 3 ? (
                <div className="flex items-center justify-center py-6">
                  <span className="text-sm text-muted-foreground">No addresses found</span>
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Validation Results */}
      {showValidation && validationResult && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Validation Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getValidationIcon()}
                  <span className="text-sm font-medium">
                    Address Validation
                  </span>
                </div>
                <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                  {validationResult.confidence.toUpperCase()}
                </Badge>
              </div>

              {/* Delivery Zone */}
              {validationResult.deliveryZone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>Delivery Zone: {validationResult.deliveryZone}</span>
                </div>
              )}

              {/* Issues */}
              {validationResult.issues.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-destructive">Issues:</h4>
                  <ul className="text-sm space-y-1">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {validationResult.suggestions.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Suggestions:</h4>
                  <ul className="text-sm space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Preview */}
      {showShippingPreview && shippingData && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Shipping Options</span>
              </div>
              
              <div className="grid gap-2">
                {shippingData.options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{option.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">${option.cost}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.ceil(option.timeMinutes / 1440)} days
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Intelligence */}
      {showLocationIntelligence && selectedAddress && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Location Intelligence</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedAddress.coordinates && (
                  <div>
                    <span className="text-muted-foreground">Coordinates:</span>
                    <div className="font-mono text-xs">
                      {selectedAddress.coordinates.lat.toFixed(4)}, {selectedAddress.coordinates.lng.toFixed(4)}
                    </div>
                  </div>
                )}
                
                {selectedAddress.timezone && (
                  <div>
                    <span className="text-muted-foreground">Timezone:</span>
                    <div>{selectedAddress.timezone}</div>
                  </div>
                )}
                
                {selectedAddress.region && (
                  <div>
                    <span className="text-muted-foreground">Region:</span>
                    <div>{selectedAddress.region}</div>
                  </div>
                )}
                
                {selectedAddress.addressType && (
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="ml-1">
                      {selectedAddress.addressType}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAddressInput;