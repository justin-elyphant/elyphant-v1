import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, MapPin, Clock, Truck } from 'lucide-react';
import { unifiedLocationService, AddressValidationResult } from '@/services/location/UnifiedLocationService';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { toast } from 'sonner';

interface AddressVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: StandardizedAddress;
  onVerified: (verificationData: {
    verified: boolean;
    method: string;
    verifiedAt: string;
  }) => void;
}

export const AddressVerificationModal: React.FC<AddressVerificationModalProps> = ({
  open,
  onOpenChange,
  address,
  onVerified
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);
  const [hasValidated, setHasValidated] = useState(false);

  const handleVerifyAddress = async () => {
    setIsValidating(true);
    try {
      console.log('🔍 Starting address verification:', address);
      const result = await unifiedLocationService.validateAddressForDelivery(address);
      setValidationResult(result);
      setHasValidated(true);
      
      if (result.isValid) {
        toast.success('Address verified successfully!');
      } else {
        toast.warning('Address verification completed with issues');
      }
    } catch (error) {
      console.error('Error validating address:', error);
      toast.error('Failed to verify address');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmVerification = (method: 'automatic' | 'user_confirmed') => {
    const verificationData = {
      verified: true,
      method,
      verifiedAt: new Date().toISOString()
    };
    
    onVerified(verificationData);
    onOpenChange(false);
    toast.success('Address verification complete!');
  };

  const formatAddress = (addr: StandardizedAddress) => {
    const parts = [addr.street];
    // Add apartment/suite if it exists
    if (addr.line2 && addr.line2.trim()) {
      parts.push(addr.line2);
    }
    if (addr.city && addr.state && addr.zipCode) {
      parts.push(`${addr.city}, ${addr.state} ${addr.zipCode}`);
    }
    return parts.join(', ');
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><Check className="h-3 w-3 mr-1" />High Confidence</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="h-3 w-3 mr-1" />Medium Confidence</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Low Confidence</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Verify Your Address
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Address to Verify:</h4>
            <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
          </div>

          {!hasValidated ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                We'll verify this address to ensure accurate delivery estimates and enable all platform features.
              </p>
              <Button 
                onClick={handleVerifyAddress} 
                disabled={isValidating}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Verifying Address...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Verify Address
                  </>
                )}
              </Button>
            </div>
          ) : validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification Status:</span>
                {getConfidenceBadge(validationResult.confidence)}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Delivery verification complete</span>
              </div>

              {validationResult.issues && validationResult.issues.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-yellow-800 mb-1">Issues Found:</h5>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-800 mb-1">Suggestions:</h5>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2">
          {hasValidated && validationResult && (
            <>
              {validationResult.isValid && validationResult.confidence === 'high' && (
                <Button 
                  onClick={() => handleConfirmVerification('automatic')}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Verified Address
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => handleConfirmVerification('user_confirmed')}
                className="w-full"
              >
                Use This Address Anyway
              </Button>
            </>
          )}
          
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};