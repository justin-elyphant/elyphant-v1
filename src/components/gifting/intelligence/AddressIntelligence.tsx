import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, CheckCircle, AlertTriangle, Truck, Clock, DollarSign } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddressAnalysis {
  address: any;
  confidence_score: number;
  validation_status: 'valid' | 'invalid' | 'needs_correction';
  suggested_corrections?: any;
  shipping_zones: {
    standard: { days: number; cost: number };
    express: { days: number; cost: number };
    overnight: { days: number; cost: number };
  };
  delivery_notes?: string[];
  risk_factors: string[];
  recommendations: string[];
}

interface AddressIntelligenceProps {
  address: any;
  onAddressUpdate?: (updatedAddress: any) => void;
  onAnalysisComplete?: (analysis: AddressAnalysis) => void;
}

const AddressIntelligence: React.FC<AddressIntelligenceProps> = ({
  address,
  onAddressUpdate,
  onAnalysisComplete
}) => {
  const { profile } = useProfile();
  const [analysis, setAnalysis] = useState<AddressAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (address) {
      analyzeAddress();
      fetchHistoricalData();
    }
  }, [address]);

  const analyzeAddress = async () => {
    if (!address || !profile) return;

    setLoading(true);
    try {
      // Simulate comprehensive address analysis
      const mockAnalysis: AddressAnalysis = {
        address,
        confidence_score: calculateConfidenceScore(address),
        validation_status: validateAddress(address),
        shipping_zones: calculateShippingZones(address),
        delivery_notes: generateDeliveryNotes(address),
        risk_factors: identifyRiskFactors(address),
        recommendations: generateRecommendations(address)
      };

      // Add suggested corrections if validation fails
      if (mockAnalysis.validation_status === 'needs_correction') {
        mockAnalysis.suggested_corrections = generateCorrections(address);
      }

      setAnalysis(mockAnalysis);
      onAnalysisComplete?.(mockAnalysis);

      // Store analysis for future reference
      await supabase
        .from('address_intelligence')
        .upsert({
          user_id: profile.id,
          address_hash: generateAddressHash(address),
          analysis: mockAnalysis as any,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error analyzing address:', error);
      toast.error('Failed to analyze address');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          shipping_address,
          total_amount,
          status,
          line_items
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter orders with similar addresses
      const similarAddresses = (data || []).filter(order => {
        const shippingAddress = order.shipping_address as any;
        return shippingAddress && addressSimilarity(shippingAddress, address) > 0.7;
      });

      setHistoricalData(similarAddresses);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const calculateConfidenceScore = (addr: any): number => {
    let score = 0;
    
    // Check completeness
    if (addr.street) score += 30;
    if (addr.city) score += 25;
    if (addr.state) score += 20;
    if (addr.zipCode) score += 15;
    if (addr.country) score += 10;
    
    return Math.min(score, 100);
  };

  const validateAddress = (addr: any): 'valid' | 'invalid' | 'needs_correction' => {
    if (!addr.street || !addr.city || !addr.state || !addr.zipCode) {
      return 'invalid';
    }
    
    // Simulate validation logic
    if (addr.zipCode.length !== 5 || !/^\d+$/.test(addr.zipCode)) {
      return 'needs_correction';
    }
    
    return 'valid';
  };

  const calculateShippingZones = (addr: any) => {
    // Simulate shipping zone calculation based on address
    const baseRate = 8.99;
    const stateMultiplier = getStateMultiplier(addr.state);
    
    return {
      standard: { days: 5, cost: baseRate * stateMultiplier },
      express: { days: 2, cost: baseRate * stateMultiplier * 2 },
      overnight: { days: 1, cost: baseRate * stateMultiplier * 3.5 }
    };
  };

  const getStateMultiplier = (state: string): number => {
    const remoteStates = ['AK', 'HI', 'PR'];
    return remoteStates.includes(state) ? 1.5 : 1;
  };

  const generateDeliveryNotes = (addr: any): string[] => {
    const notes: string[] = [];
    
    if (addr.street.toLowerCase().includes('apt') || addr.street.toLowerCase().includes('unit')) {
      notes.push('Apartment/Unit delivery - ensure buzzer access');
    }
    
    if (addr.city.toLowerCase().includes('rural') || addr.zipCode.startsWith('0')) {
      notes.push('Rural delivery area - may require additional time');
    }
    
    return notes;
  };

  const identifyRiskFactors = (addr: any): string[] => {
    const risks: string[] = [];
    
    if (!addr.street.match(/\d+/)) {
      risks.push('No street number detected');
    }
    
    if (addr.zipCode.startsWith('0000')) {
      risks.push('Invalid ZIP code format');
    }
    
    return risks;
  };

  const generateRecommendations = (addr: any): string[] => {
    const recommendations: string[] = [];
    
    if (historicalData.length > 0) {
      recommendations.push('Based on previous orders, consider express shipping for better experience');
    }
    
    if (addr.state && ['CA', 'NY', 'TX'].includes(addr.state)) {
      recommendations.push('High-traffic area - consider signature confirmation');
    }
    
    return recommendations;
  };

  const generateCorrections = (addr: any): any => {
    const corrections: any = {};
    
    if (addr.zipCode && addr.zipCode.length !== 5) {
      corrections.zipCode = addr.zipCode.padStart(5, '0');
    }
    
    return corrections;
  };

  const generateAddressHash = (addr: any): string => {
    return btoa(`${addr.street}-${addr.city}-${addr.state}-${addr.zipCode}`);
  };

  const addressSimilarity = (addr1: any, addr2: any): number => {
    const keys = ['street', 'city', 'state', 'zipCode'];
    let matches = 0;
    
    keys.forEach(key => {
      if (addr1[key] && addr2[key] && addr1[key].toLowerCase() === addr2[key].toLowerCase()) {
        matches++;
      }
    });
    
    return matches / keys.length;
  };

  const applyCorrections = () => {
    if (analysis?.suggested_corrections && onAddressUpdate) {
      const correctedAddress = { ...address, ...analysis.suggested_corrections };
      onAddressUpdate(correctedAddress);
      toast.success('Address corrections applied');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Analyzing address...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Address Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Confidence Score</span>
            <Badge variant={analysis.confidence_score >= 80 ? 'default' : 'secondary'}>
              {analysis.confidence_score}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Validation Status</span>
            <Badge 
              variant={
                analysis.validation_status === 'valid' ? 'default' : 
                analysis.validation_status === 'needs_correction' ? 'secondary' : 'destructive'
              }
            >
              {analysis.validation_status === 'valid' && <CheckCircle className="h-3 w-3 mr-1" />}
              {analysis.validation_status === 'needs_correction' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {analysis.validation_status}
            </Badge>
          </div>

          {analysis.suggested_corrections && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Address corrections suggested</span>
                <Button size="sm" onClick={applyCorrections}>
                  Apply Corrections
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Shipping Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(analysis.shipping_zones).map(([method, info]) => (
            <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium capitalize">{method}</span>
                </div>
                <span className="text-sm text-muted-foreground">{info.days} days</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{info.cost.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Notes */}
      {analysis.delivery_notes && analysis.delivery_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.delivery_notes.map((note, index) => (
                <Alert key={index}>
                  <AlertDescription>{note}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      {analysis.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.risk_factors.map((risk, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>{risk}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <Alert key={index}>
                  <AlertDescription>{rec}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Data */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {historicalData.length} previous orders to similar addresses
            </div>
            <div className="mt-2 text-sm">
              Average delivery time: 3-5 days
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressIntelligence;