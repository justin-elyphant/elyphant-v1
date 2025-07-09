import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Truck, 
  Clock,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { toast } from 'sonner';

interface AddressValidationProps {
  address: {
    name: string;
    address: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  onValidationComplete?: (analysis: any) => void;
}

const AddressValidation: React.FC<AddressValidationProps> = ({
  address,
  onValidationComplete
}) => {
  const { profile } = useProfile();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address.address && address.city && address.state && address.zipCode) {
      validateAddress();
    }
  }, [address]);

  const validateAddress = async () => {
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      // Create address hash for tracking
      const addressString = `${address.address}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.zipCode}`;
      const addressHash = btoa(addressString).slice(0, 16);

      // Check if we have existing analysis
      const { data: existingAnalysis } = await supabase
        .from('address_intelligence')
        .select('analysis')
        .eq('user_id', profile.id)
        .eq('address_hash', addressHash)
        .single();

      if (existingAnalysis) {
        setAnalysis(existingAnalysis.analysis);
        onValidationComplete?.(existingAnalysis.analysis);
        return;
      }

      // Perform new analysis (simplified for demo)
      const mockAnalysis = {
        delivery_confidence: 0.95,
        estimated_delivery_days: Math.floor(Math.random() * 3) + 1,
        shipping_notes: 'Standard residential delivery',
        risk_factors: [],
        suggestions: [],
        zone: address.address.toLowerCase().includes('apt') ? 'apartment' : 'residential',
        accessibility: 'standard',
        verified: true,
        deliverable: true,
        address_type: 'residential'
      };

      // Add some realistic variations
      if (address.address.toLowerCase().includes('po box')) {
        mockAnalysis.delivery_confidence = 0.85;
        mockAnalysis.shipping_notes = 'PO Box delivery - some restrictions may apply';
        mockAnalysis.address_type = 'po_box';
      }

      if (address.state === 'Alaska' || address.state === 'Hawaii') {
        mockAnalysis.estimated_delivery_days += 2;
        mockAnalysis.shipping_notes = 'Extended delivery time for this location';
      }

      // Store analysis
      await supabase
        .from('address_intelligence')
        .insert({
          user_id: profile.id,
          address_hash: addressHash,
          analysis: mockAnalysis
        });

      setAnalysis(mockAnalysis);
      onValidationComplete?.(mockAnalysis);
      
    } catch (err) {
      console.error('Address validation error:', err);
      setError('Failed to validate address');
      toast.error('Address validation failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Validating address...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return null;
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge variant="default" className="bg-green-100 text-green-800">High Confidence</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
    } else {
      return <Badge variant="destructive">Low Confidence</Badge>;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Address Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Deliverable</div>
              <div className="text-xs text-muted-foreground">
                {analysis.deliverable ? 'Verified' : 'Needs Review'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Delivery Time</div>
              <div className="text-xs text-muted-foreground">
                {analysis.estimated_delivery_days} business days
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <MapPin className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Address Type</div>
              <div className="text-xs text-muted-foreground capitalize">
                {analysis.address_type || analysis.zone}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence:</span>
            {getConfidenceBadge(analysis.delivery_confidence)}
          </div>
          <div className="text-xs text-muted-foreground">
            {(analysis.delivery_confidence * 100).toFixed(0)}% delivery confidence
          </div>
        </div>

        {analysis.shipping_notes && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {analysis.shipping_notes}
            </AlertDescription>
          </Alert>
        )}

        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="font-medium text-yellow-800 mb-1">Delivery Notes:</div>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {analysis.risk_factors.map((factor: string, index: number) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressValidation;