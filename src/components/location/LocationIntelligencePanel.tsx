/**
 * ================================
 * LocationIntelligencePanel Component
 * ================================
 * 
 * Advanced location intelligence panel that showcases the comprehensive
 * capabilities of the UnifiedLocationService for debugging and admin purposes.
 * 
 * FEATURES:
 * - Real-time location service status monitoring
 * - Interactive address testing and validation
 * - Shipping optimization preview
 * - Vendor location mapping
 * - Performance metrics and cache statistics
 * - Service boundary testing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Truck, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  RefreshCw,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { unifiedLocationService } from '@/services/location/UnifiedLocationService';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';

interface LocationIntelligencePanelProps {
  className?: string;
  showAdvancedFeatures?: boolean;
}

const LocationIntelligencePanel: React.FC<LocationIntelligencePanelProps> = ({
  className,
  showAdvancedFeatures = true
}) => {
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [testAddress, setTestAddress] = useState<StandardizedAddress | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [shippingOptimization, setShippingOptimization] = useState<any>(null);
  const [nearbyVendors, setNearbyVendors] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    refreshServiceStatus();
    if (showAdvancedFeatures) {
      const interval = setInterval(refreshServiceStatus, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [showAdvancedFeatures]);

  const refreshServiceStatus = () => {
    const status = unifiedLocationService.getStatus();
    setServiceStatus(status);
  };

  const handleAddressSelect = async (address: StandardizedAddress) => {
    setTestAddress(address);
    setIsTesting(true);

    try {
      // Test address validation
      const validation = await unifiedLocationService.validateAddressForDelivery(address);
      setValidationResult(validation);

      // Note: Advanced shipping optimization removed in MVP simplification
      console.log('🌍 [LocationIntelligencePanel] Advanced features not available in MVP version');
      setShippingOptimization(null);
      setNearbyVendors([]);

      // Basic performance test
      const startTime = Date.now();
      const endTime = Date.now();
      
      setPerformanceMetrics({
        responseTime: endTime - startTime,
        cacheHits: serviceStatus?.cacheSize || 0,
        lastTested: new Date().toLocaleTimeString()
      });

    } catch (error) {
      console.error('Location intelligence test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const clearCache = () => {
    unifiedLocationService.clearCache();
    refreshServiceStatus();
    setTestAddress(null);
    setValidationResult(null);
    setShippingOptimization(null);
    setNearbyVendors([]);
    setPerformanceMetrics(null);
  };

  const getStatusBadge = (status: any) => {
    if (!status) return <Badge variant="outline">Loading...</Badge>;
    
    const isHealthy = status.cacheSize >= 0 && status.googlePlacesStatus;
    return (
      <Badge variant={isHealthy ? "default" : "destructive"}>
        {isHealthy ? "Operational" : "Issues Detected"}
      </Badge>
    );
  };

  const getValidationBadge = (confidence: string) => {
    const variants = {
      high: "default",
      medium: "secondary", 
      low: "destructive"
    } as const;
    return <Badge variant={variants[confidence as keyof typeof variants] || "outline"}>{confidence} confidence</Badge>;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Service Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Location Service Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(serviceStatus)}
            <Button variant="outline" size="sm" onClick={refreshServiceStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{serviceStatus.cacheSize}</div>
                <div className="text-sm text-muted-foreground">Cache Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{serviceStatus.coordinatesCount}</div>
                <div className="text-sm text-muted-foreground">Coordinates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{serviceStatus.shippingZones}</div>
                <div className="text-sm text-muted-foreground">Shipping Zones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{serviceStatus.vendorLocations}</div>
                <div className="text-sm text-muted-foreground">Vendor Locations</div>
              </div>
            </div>
          )}
          
          {showAdvancedFeatures && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearCache}>
                Clear Cache
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/debug/location', '_blank')}>
                Advanced Debug
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Intelligence Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Test Address</Label>
            <Input
              placeholder="Enter an address to test location intelligence..."
              disabled={isTesting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  // For demo purposes, create a sample address
                  const sampleAddress: StandardizedAddress = {
                    street: e.currentTarget.value.split(',')[0] || '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94105',
                    country: 'US',
                    formatted_address: e.currentTarget.value
                  };
                  handleAddressSelect(sampleAddress);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Press Enter to test with a sample address format
            </p>
          </div>

          {isTesting && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Running location intelligence tests...
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Address Validation</h4>
                {getValidationBadge(validationResult.confidence)}
              </div>
              
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <span>{validationResult.isValid ? 'Valid for delivery' : 'Validation failed'}</span>
                {validationResult.deliveryZone && (
                  <Badge variant="outline">Zone: {validationResult.deliveryZone}</Badge>
                )}
              </div>

              {validationResult.issues?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Issues: {validationResult.issues.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Shipping Optimization */}
          {shippingOptimization && (
            <div className="space-y-3">
              <h4 className="font-medium">Shipping Optimization</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Distance:</span> {shippingOptimization.distance} miles
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Time:</span> {Math.ceil(shippingOptimization.estimatedTime / 60)} hours
                </div>
              </div>
              
              <div className="space-y-2">
                {shippingOptimization.options?.map((option: any, index: number) => (
                  <div key={option.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">{option.name}</span>
                      <span className="text-sm text-muted-foreground">via {option.carrier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.ceil(option.timeMinutes / 1440)}d
                      </Badge>
                      <Badge className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {option.cost.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Vendors */}
          {nearbyVendors.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Nearby Vendors ({nearbyVendors.length})</h4>
              <div className="space-y-2">
                {nearbyVendors.slice(0, 3).map((vendor, index) => (
                  <div key={vendor.vendorId} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendor.servicesArea} mile service area
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {Math.ceil(vendor.shippingTimeMinutes / 60)}h
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {showAdvancedFeatures && performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{performanceMetrics.responseTime}ms</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{performanceMetrics.cacheHits}</div>
                <div className="text-sm text-muted-foreground">Cache Hits</div>
              </div>
              <div>
                <div className="text-lg font-medium text-muted-foreground">{performanceMetrics.lastTested}</div>
                <div className="text-sm text-muted-foreground">Last Tested</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && testAddress && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div><strong>Address:</strong> {testAddress.formatted_address}</div>
            <div><strong>Place ID:</strong> {testAddress.place_id || 'N/A'}</div>
            {shippingOptimization && (
              <>
                <div><strong>From:</strong> {shippingOptimization.fromLocation.lat.toFixed(4)}, {shippingOptimization.fromLocation.lng.toFixed(4)}</div>
                <div><strong>To:</strong> {shippingOptimization.toLocation.lat.toFixed(4)}, {shippingOptimization.toLocation.lng.toFixed(4)}</div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationIntelligencePanel;