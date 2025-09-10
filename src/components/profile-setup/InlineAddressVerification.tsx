import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Loader2,
  Info
} from 'lucide-react';
import { unifiedLocationService, AddressValidationResult } from '@/services/location/UnifiedLocationService';
import { StandardizedAddress } from '@/services/googlePlacesService';

interface InlineAddressVerificationProps {
  address: {
    street?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  onVerificationChange: (isVerified: boolean, result: AddressValidationResult | null) => void;
}

const InlineAddressVerification: React.FC<InlineAddressVerificationProps> = ({
  address,
  onVerificationChange
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check if all required fields are filled
  const isAddressComplete = address.street && address.city && address.state && address.zipCode;
  
  console.log('🏠 [InlineAddressVerification] Address data:', address);
  console.log('🏠 [InlineAddressVerification] Is complete:', isAddressComplete);

  useEffect(() => {
    console.log('🏠 [InlineAddressVerification] Address changed, isComplete:', isAddressComplete);
    if (isAddressComplete) {
      console.log('🏠 [InlineAddressVerification] Validating address...');
      validateAddress();
    } else {
      console.log('🏠 [InlineAddressVerification] Address incomplete, clearing validation');
      setValidationResult(null);
      onVerificationChange(false, null);
    }
  }, [address.street, address.city, address.state, address.zipCode, address.country]);

  const validateAddress = async () => {
    setIsValidating(true);
    
    try {
      const standardizedAddress: StandardizedAddress = {
        street: address.street!,
        city: address.city!,
        state: address.state!,
        zipCode: address.zipCode!,
        country: address.country || 'US',
        formatted_address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
      };

      const result = await unifiedLocationService.validateAddressForDelivery(standardizedAddress);
      setValidationResult(result);
      onVerificationChange(result.isValid, result);
    } catch (error) {
      console.error('Address validation error:', error);
      const errorResult: AddressValidationResult = {
        isValid: false,
        confidence: 'low',
        issues: ['Unable to validate address'],
        suggestions: ['Please check your address and try again']
      };
      setValidationResult(errorResult);
      onVerificationChange(false, errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isAddressComplete) {
    console.log('🏠 [InlineAddressVerification] Not rendering - address incomplete');
    return null;
  }

  console.log('🏠 [InlineAddressVerification] Rendering verification component');

  if (isValidating) {
    return (
      <Card className="mt-4 border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Validating your address...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) {
    return null;
  }

  const getStatusColor = () => {
    if (validationResult.isValid && validationResult.confidence === 'high') return 'green';
    if (validationResult.isValid && validationResult.confidence === 'medium') return 'yellow';
    return 'red';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'green') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (color === 'yellow') return <Info className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusMessage = () => {
    if (validationResult.isValid && validationResult.confidence === 'high') {
      return 'Address verified and ready for delivery';
    }
    if (validationResult.isValid && validationResult.confidence === 'medium') {
      return 'Address looks good with minor suggestions';
    }
    return 'Address needs attention';
  };

  const getBadgeVariant = () => {
    const color = getStatusColor();
    if (color === 'green') return 'default';
    if (color === 'yellow') return 'secondary';
    return 'destructive';
  };

  const getBadgeText = () => {
    if (validationResult.isValid && validationResult.confidence === 'high') return 'Verified';
    if (validationResult.isValid && validationResult.confidence === 'medium') return 'Verified with notes';
    return 'Needs review';
  };

  return (
    <Card className={`mt-4 border-${getStatusColor()}-200 bg-${getStatusColor()}-50`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{getStatusMessage()}</span>
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {getBadgeText()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 inline mr-1" />
                {address.street}, {address.city}, {address.state} {address.zipCode}
              </div>
            </div>
          </div>
          
          {(validationResult.issues.length > 0 || validationResult.suggestions.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              {showDetails ? 'Hide' : 'View'} Details
            </Button>
          )}
        </div>

        {showDetails && (validationResult.issues.length > 0 || validationResult.suggestions.length > 0) && (
          <div className="mt-4 space-y-2">
            {validationResult.issues.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm">
                  <div className="font-medium text-red-800 mb-1">Issues found:</div>
                  <ul className="text-red-700 list-disc list-inside">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validationResult.suggestions.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <div className="font-medium text-yellow-800 mb-1">Suggestions:</div>
                  <ul className="text-yellow-700 list-disc list-inside">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InlineAddressVerification;