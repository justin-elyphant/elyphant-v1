/**
 * ================================
 * LocationBasedProductSearch Component
 * ================================
 * 
 * Enhanced product search component that uses UnifiedLocationService
 * to provide location-aware product recommendations and vendor matching.
 * 
 * FEATURES:
 * - Location-based product filtering
 * - Nearby vendor prioritization
 * - Shipping time estimates
 * - Regional availability filtering
 * - Dynamic search radius adjustment
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Truck, Filter, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { unifiedLocationService, LocationCoordinates, LocationBasedSearch, VendorLocation } from '@/services/location/UnifiedLocationService';
import { useUnifiedMarketplace } from '@/hooks/useUnifiedMarketplace';

interface LocationBasedProductSearchProps {
  userLocation?: LocationCoordinates;
  onLocationUpdate?: (location: LocationCoordinates) => void;
  className?: string;
}

const LocationBasedProductSearch: React.FC<LocationBasedProductSearchProps> = ({
  userLocation,
  onLocationUpdate,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRadius, setSearchRadius] = useState([25]); // miles
  const [preferLocalVendors, setPreferLocalVendors] = useState(true);
  const [includeRegionalProducts, setIncludeRegionalProducts] = useState(true);
  const [maxShippingTime, setMaxShippingTime] = useState([2880]); // 2 days in minutes
  const [nearbyVendors, setNearbyVendors] = useState<VendorLocation[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<LocationCoordinates | null>(null);

  const { 
    products: searchResults,
    isLoading: isSearching
  } = useUnifiedMarketplace();

  useEffect(() => {
    if (userLocation) {
      loadNearbyVendors(userLocation);
    } else {
      detectUserLocation();
    }
  }, [userLocation]);

  const detectUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setDetectedLocation(location);
          onLocationUpdate?.(location);
          loadNearbyVendors(location);
          console.log('🌍 [LocationBasedProductSearch] User location detected:', location);
        },
        (error) => {
          console.warn('🌍 [LocationBasedProductSearch] Geolocation error:', error);
          // Fallback to default location (San Francisco)
          const defaultLocation = { lat: 37.7749, lng: -122.4194 };
          setDetectedLocation(defaultLocation);
          onLocationUpdate?.(defaultLocation);
          loadNearbyVendors(defaultLocation);
        }
      );
    }
  };

  const loadNearbyVendors = async (location: LocationCoordinates) => {
    setIsLoadingVendors(true);
    try {
      const vendors = await unifiedLocationService.findNearbyVendors(
        location, 
        searchRadius[0]
      );
      setNearbyVendors(vendors);
      console.log(`🌍 [LocationBasedProductSearch] Found ${vendors.length} nearby vendors`);
    } catch (error) {
      console.error('🌍 [LocationBasedProductSearch] Error loading vendors:', error);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleLocationBasedSearch = async () => {
    const currentLocation = userLocation || detectedLocation;
    if (!currentLocation || !searchTerm.trim()) return;

    console.log('🌍 [LocationBasedProductSearch] Starting location-based search:', {
      searchTerm,
      location: currentLocation,
      searchRadius: searchRadius[0],
      preferLocalVendors,
      maxShippingTime: maxShippingTime[0]
    });

    const searchOptions: LocationBasedSearch = {
      userLocation: currentLocation,
      searchRadius: searchRadius[0],
      includeRegionalProducts,
      preferLocalVendors,
      maxShippingTime: maxShippingTime[0]
    };

    try {
      // Use UnifiedLocationService for location-aware product search
      const products = await unifiedLocationService.searchProductsByLocation(
        searchTerm,
        currentLocation,
        searchOptions
      );

      console.log(`🌍 [LocationBasedProductSearch] Found ${products.length} location-optimized products`);
    } catch (error) {
      console.error('🌍 [LocationBasedProductSearch] Search error:', error);
    }
  };

  const handleRadiusChange = (newRadius: number[]) => {
    setSearchRadius(newRadius);
    const currentLocation = userLocation || detectedLocation;
    if (currentLocation) {
      loadNearbyVendors(currentLocation);
    }
  };

  const formatShippingTime = (minutes: number): string => {
    const hours = Math.ceil(minutes / 60);
    const days = Math.ceil(minutes / 1440);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const currentLocation = userLocation || detectedLocation;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Location Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLocation ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Current Location</div>
                <div className="text-xs text-muted-foreground">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Target className="h-3 w-3 mr-1" />
                Located
              </Badge>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Detecting location...
            </div>
          )}
          
          {/* Search Radius Control */}
          <div className="space-y-2">
            <Label className="text-sm">Search Radius: {searchRadius[0]} miles</Label>
            <Slider
              value={searchRadius}
              onValueChange={handleRadiusChange}
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Location Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="prefer-local" className="text-sm">
              Prefer Local Vendors
            </Label>
            <Switch
              id="prefer-local"
              checked={preferLocalVendors}
              onCheckedChange={setPreferLocalVendors}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="regional-products" className="text-sm">
              Include Regional Products
            </Label>
            <Switch
              id="regional-products"
              checked={includeRegionalProducts}
              onCheckedChange={setIncludeRegionalProducts}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">
              Max Shipping Time: {formatShippingTime(maxShippingTime[0])}
            </Label>
            <Slider
              value={maxShippingTime}
              onValueChange={setMaxShippingTime}
              max={10080} // 1 week
              min={720} // 12 hours
              step={720} // 12 hour increments
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Interface */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Location-Based Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationBasedSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleLocationBasedSearch}
              disabled={!searchTerm.trim() || !currentLocation || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {searchResults.length} location-optimized results
          </div>
        </CardContent>
      </Card>

      {/* Nearby Vendors */}
      {nearbyVendors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              Nearby Vendors ({nearbyVendors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingVendors ? (
                <div className="text-sm text-muted-foreground">Loading vendors...</div>
              ) : (
                nearbyVendors.slice(0, 5).map((vendor) => (
                  <div key={vendor.vendorId} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{vendor.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Service area: {vendor.servicesArea} miles
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {formatShippingTime(vendor.shippingTimeMinutes)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Location-Optimized Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.slice(0, 6).map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-muted-foreground">
                        ${product.price}
                      </div>
                      {product.vendor && (
                        <Badge variant="outline" className="text-xs">
                          {product.vendor}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug: Location Service Status</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>Service Status: {JSON.stringify(unifiedLocationService.getStatus())}</div>
            <div>Search Radius: {searchRadius[0]} miles</div>
            <div>Nearby Vendors: {nearbyVendors.length}</div>
            <div>Location Detected: {currentLocation ? 'Yes' : 'No'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationBasedProductSearch;