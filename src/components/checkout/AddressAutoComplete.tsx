import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { standardizedToForm } from '@/utils/addressStandardization';

interface AddressValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestions: string[];
  deliverable: boolean;
}

interface AddressAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: StandardizedAddress) => void;
  onValidationChange?: (result: AddressValidationResult) => void;
  label?: string;
  placeholder?: string;
  showValidation?: boolean;
}

const AddressAutoComplete: React.FC<AddressAutoCompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  onValidationChange,
  label = "Street Address",
  placeholder = "Start typing your address...",
  showValidation = true
}) => {
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Simulate address validation (in real app, this would call a validation service)
  const validateAddress = async (address: string): Promise<AddressValidationResult> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    
    // Basic validation logic
    const hasNumber = /\d/.test(address);
    const hasStreetKeywords = /(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|circle|cir|court|ct|place|pl)/i.test(address);
    const isComplete = address.length > 10;
    
    const isValid = hasNumber && hasStreetKeywords && isComplete;
    const confidence = isValid ? 'high' : address.length > 5 ? 'medium' : 'low';
    
    return {
      isValid,
      confidence,
      suggestions: isValid ? [] : [
        "Try including a street number",
        "Make sure to include street type (St, Ave, etc.)",
        "Check spelling of street name"
      ],
      deliverable: isValid
    };
  };

  useEffect(() => {
    if (value.length > 5) {
      setIsValidating(true);
      const timeoutId = setTimeout(async () => {
        const result = await validateAddress(value);
        setValidationResult(result);
        setIsValidating(false);
        onValidationChange?.(result);
      }, 1000); // Debounce validation

      return () => clearTimeout(timeoutId);
    } else {
      setValidationResult(null);
      setIsValidating(false);
    }
  }, [value, onValidationChange]);

  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    const formAddr = standardizedToForm(standardizedAddress);
    onChange(formAddr.street);
    onAddressSelect?.(standardizedAddress);
    
    // Set high confidence for Google Places results
    const result: AddressValidationResult = {
      isValid: true,
      confidence: 'high',
      suggestions: [],
      deliverable: true
    };
    setValidationResult(result);
    onValidationChange?.(result);
  };

  const getValidationColor = () => {
    if (!validationResult) return '';
    if (validationResult.isValid) return 'text-green-600';
    if (validationResult.confidence === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationIcon = () => {
    if (isValidating) return null;
    if (!validationResult) return null;
    
    return validationResult.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-600" />
    );
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label}
          {validationResult && (
            <Badge 
              variant={validationResult.isValid ? "default" : "outline"}
              className={`text-xs ${getValidationColor()}`}
            >
              {validationResult.confidence} confidence
            </Badge>
          )}
        </Label>
        
        <div className="relative">
          <GooglePlacesAutocomplete
            value={value}
            onChange={onChange}
            onAddressSelect={handleGooglePlacesSelect}
            label=""
            placeholder={placeholder}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating && (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
            {getValidationIcon()}
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {showValidation && validationResult && !validationResult.isValid && validationResult.suggestions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Address Suggestions</p>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {showValidation && validationResult?.isValid && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>Address verified and deliverable</span>
        </div>
      )}
    </div>
  );
};

export default AddressAutoComplete;