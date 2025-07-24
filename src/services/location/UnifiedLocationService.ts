/**
 * ================================
 * UnifiedLocationService
 * ================================
 * 
 * Centralized location intelligence service that enhances the application's
 * Google Maps integration with advanced location-based features.
 * 
 * INTEGRATION BOUNDARIES:
 * - CALLS: UnifiedMarketplaceService for location-based product operations
 * - CALLS: UnifiedPaymentService for shipping cost calculations
 * - CALLED BY: Components, hooks, other services
 * 
 * NEVER:
 * - Bypasses UnifiedMarketplaceService for product operations
 * - Implements payment logic (belongs to UnifiedPaymentService)
 * - Duplicates existing Google Places functionality
 * 
 * LOCATION INTELLIGENCE FEATURES:
 * - Enhanced address autocomplete and validation
 * - Geocoding and reverse geocoding
 * - Distance calculations for shipping optimization
 * - Location-based vendor matching
 * - Shipping zone optimization
 * - Location caching and performance optimization
 */

import { googlePlacesService, GooglePlacesPrediction, StandardizedAddress } from '../googlePlacesService';
import { unifiedMarketplaceService } from '../marketplace/UnifiedMarketplaceService';
import { unifiedPaymentService } from '../payment/UnifiedPaymentService';

// ================================
// Type Definitions
// ================================

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface EnhancedAddress extends StandardizedAddress {
  coordinates?: LocationCoordinates;
  timezone?: string;
  region?: string;
  addressType?: 'business' | 'residential' | 'po_box';
  deliveryZone?: string;
  isValidForDelivery?: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  coordinates: LocationCoordinates[];
  deliveryTimeMinutes: number;
  shippingCostMultiplier: number;
  isActive: boolean;
}

export interface VendorLocation {
  vendorId: string;
  name: string;
  address: EnhancedAddress;
  coordinates: LocationCoordinates;
  servicesArea: number; // radius in miles
  shippingTimeMinutes: number;
  isActive: boolean;
}

export interface LocationBasedSearch {
  userLocation?: LocationCoordinates;
  searchRadius?: number; // in miles
  includeRegionalProducts?: boolean;
  preferLocalVendors?: boolean;
  maxShippingTime?: number; // in minutes
}

export interface ShippingOptimization {
  fromLocation: LocationCoordinates;
  toLocation: LocationCoordinates;
  distance: number; // in miles
  estimatedTime: number; // in minutes
  cost: number;
  options: ShippingOption[];
}

export interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  timeMinutes: number;
  carrier?: string;
  trackingAvailable?: boolean;
}

// ================================
// UnifiedLocationService Class
// ================================

class UnifiedLocationService {
  private cache = new Map<string, any>();
  private coordinates = new Map<string, LocationCoordinates>();
  private shippingZones: ShippingZone[] = [];
  private vendorLocations: VendorLocation[] = [];
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    console.log('🌍 [UnifiedLocationService] Service initialized');
    this.initializeShippingZones();
    this.initializeVendorLocations();
  }

  // ================================
  // Enhanced Address Operations
  // ================================

  /**
   * Enhanced address autocomplete with location intelligence
   */
  async getEnhancedAddressPredictions(
    input: string, 
    options?: {
      preferBusiness?: boolean;
      includeCoordinates?: boolean;
      filterByDelivery?: boolean;
    }
  ): Promise<GooglePlacesPrediction[]> {
    console.log(`🌍 [UnifiedLocationService] Enhanced address predictions for: "${input}"`);
    
    try {
      // Get base predictions from Google Places
      const predictions = await googlePlacesService.getAddressPredictions(input);
      
      if (options?.filterByDelivery) {
        // Filter predictions based on delivery zones
        return this.filterPredictionsByDeliveryZones(predictions);
      }
      
      return predictions;
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Address prediction error:', error);
      return [];
    }
  }

  /**
   * Get enhanced address details with location intelligence
   */
  async getEnhancedAddressDetails(placeId: string): Promise<EnhancedAddress | null> {
    console.log(`🌍 [UnifiedLocationService] Enhanced address details for: ${placeId}`);
    
    const cacheKey = `enhanced_address_${placeId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Get base address from Google Places
      const address = await googlePlacesService.getPlaceDetails(placeId);
      if (!address) return null;

      // Enhance with location intelligence
      const enhanced = await this.enhanceAddress(address);
      
      this.setCachedData(cacheKey, enhanced);
      return enhanced;
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Address details error:', error);
      return null;
    }
  }

  /**
   * Validate address for delivery
   */
  async validateAddressForDelivery(address: StandardizedAddress): Promise<{
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low';
    issues: string[];
    suggestions: string[];
    deliveryZone?: string;
  }> {
    console.log(`🌍 [UnifiedLocationService] Validating address for delivery`);
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Basic validation
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      issues.push('Missing required address fields');
    }
    
    // Check if in delivery zone
    const coordinates = await this.getCoordinatesFromAddress(address);
    const deliveryZone = coordinates ? this.getDeliveryZone(coordinates) : null;
    
    if (!deliveryZone) {
      issues.push('Address is outside delivery zones');
      suggestions.push('Check if address is correct or contact customer service');
    }
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (issues.length > 0) confidence = 'low';
    else if (!address.place_id) confidence = 'medium';
    
    return {
      isValid: issues.length === 0,
      confidence,
      issues,
      suggestions,
      deliveryZone: deliveryZone?.name
    };
  }

  // ================================
  // Location Intelligence
  // ================================

  /**
   * Get coordinates from address
   */
  async getCoordinatesFromAddress(address: StandardizedAddress): Promise<LocationCoordinates | null> {
    const addressKey = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    const cached = this.coordinates.get(addressKey);
    if (cached) return cached;

    try {
      // For demo, simulate geocoding based on city/state
      const coordinates = this.simulateGeocoding(address);
      if (coordinates) {
        this.coordinates.set(addressKey, coordinates);
      }
      return coordinates;
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Geocoding error:', error);
      return null;
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(coordinates: LocationCoordinates): Promise<StandardizedAddress | null> {
    const coordKey = `${coordinates.lat},${coordinates.lng}`;
    const cacheKey = `reverse_geocode_${coordKey}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // For demo, simulate reverse geocoding
      const address = this.simulateReverseGeocoding(coordinates);
      if (address) {
        this.setCachedData(cacheKey, address);
      }
      return address;
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two addresses
   */
  async calculateDistance(
    from: StandardizedAddress | LocationCoordinates,
    to: StandardizedAddress | LocationCoordinates
  ): Promise<{ distance: number; timeMinutes: number } | null> {
    try {
      const fromCoords = 'lat' in from ? from : await this.getCoordinatesFromAddress(from);
      const toCoords = 'lat' in to ? to : await this.getCoordinatesFromAddress(to);
      
      if (!fromCoords || !toCoords) return null;
      
      // Calculate distance using Haversine formula
      const distance = this.calculateHaversineDistance(fromCoords, toCoords);
      const timeMinutes = Math.ceil(distance * 1.5); // Rough estimate: 1.5 minutes per mile
      
      return { distance, timeMinutes };
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Distance calculation error:', error);
      return null;
    }
  }

  // ================================
  // Shipping Optimization
  // ================================

  /**
   * Get optimized shipping options for an address
   */
  async getShippingOptimization(
    toAddress: StandardizedAddress,
    fromLocation?: LocationCoordinates
  ): Promise<ShippingOptimization | null> {
    console.log(`🌍 [UnifiedLocationService] Getting shipping optimization`);
    
    try {
      const toCoords = await this.getCoordinatesFromAddress(toAddress);
      if (!toCoords) return null;
      
      // Use default warehouse location if not provided
      const fromCoords = fromLocation || { lat: 37.7749, lng: -122.4194 }; // SF default
      
      const distanceData = await this.calculateDistance(fromCoords, toCoords);
      if (!distanceData) return null;
      
      // Generate shipping options based on distance
      const options = this.generateShippingOptions(distanceData.distance, distanceData.timeMinutes);
      
      return {
        fromLocation: fromCoords,
        toLocation: toCoords,
        distance: distanceData.distance,
        estimatedTime: distanceData.timeMinutes,
        cost: this.calculateBaseCost(distanceData.distance),
        options
      };
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Shipping optimization error:', error);
      return null;
    }
  }

  /**
   * Find nearest vendors for location-based product search
   */
  async findNearbyVendors(
    userLocation: LocationCoordinates,
    maxDistance: number = 50
  ): Promise<VendorLocation[]> {
    console.log(`🌍 [UnifiedLocationService] Finding nearby vendors`);
    
    return this.vendorLocations.filter(vendor => {
      const distance = this.calculateHaversineDistance(userLocation, vendor.coordinates);
      return distance <= maxDistance && vendor.isActive;
    }).sort((a, b) => {
      const distA = this.calculateHaversineDistance(userLocation, a.coordinates);
      const distB = this.calculateHaversineDistance(userLocation, b.coordinates);
      return distA - distB;
    });
  }

  // ================================
  // Integration with Unified Services
  // ================================

  /**
   * Location-based product search (integrates with UnifiedMarketplaceService)
   */
  async searchProductsByLocation(
    searchTerm: string,
    userLocation: LocationCoordinates,
    options?: LocationBasedSearch
  ) {
    console.log(`🌍 [UnifiedLocationService] Location-based product search: "${searchTerm}"`);
    
    try {
      // CRITICAL: Use UnifiedMarketplaceService for product operations
      const products = await unifiedMarketplaceService.searchProducts(searchTerm);
      
      if (options?.preferLocalVendors) {
        const nearbyVendors = await this.findNearbyVendors(
          userLocation, 
          options.searchRadius || 50
        );
        
        // Filter products by nearby vendors (simulation for demo)
        return products.slice(0, 10); // Simplified for demo
      }
      
      return products;
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Location-based search error:', error);
      return [];
    }
  }

  /**
   * Calculate shipping costs with location intelligence (integrates with UnifiedPaymentService)
   */
  async calculateLocationBasedShipping(
    items: any[],
    shippingAddress: StandardizedAddress
  ): Promise<{ cost: number; options: ShippingOption[] }> {
    console.log(`🌍 [UnifiedLocationService] Calculating location-based shipping`);
    
    try {
      const optimization = await this.getShippingOptimization(shippingAddress);
      if (!optimization) {
        return { cost: 9.99, options: [] }; // Default fallback
      }
      
      return {
        cost: optimization.cost,
        options: optimization.options
      };
    } catch (error) {
      console.error('🌍 [UnifiedLocationService] Shipping calculation error:', error);
      return { cost: 9.99, options: [] };
    }
  }

  // ================================
  // Private Helper Methods
  // ================================

  private async enhanceAddress(address: StandardizedAddress): Promise<EnhancedAddress> {
    const coordinates = await this.getCoordinatesFromAddress(address);
    const deliveryZone = coordinates ? this.getDeliveryZone(coordinates) : null;
    
    return {
      ...address,
      coordinates,
      timezone: this.getTimezone(coordinates),
      region: this.getRegion(address.state),
      addressType: this.detectAddressType(address),
      deliveryZone: deliveryZone?.name,
      isValidForDelivery: !!deliveryZone
    };
  }

  private filterPredictionsByDeliveryZones(predictions: GooglePlacesPrediction[]): GooglePlacesPrediction[] {
    // For demo, return all predictions (would filter based on delivery zones in production)
    return predictions;
  }

  private simulateGeocoding(address: StandardizedAddress): LocationCoordinates | null {
    // Simplified geocoding simulation based on major cities
    const cityCoords: { [key: string]: LocationCoordinates } = {
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'seattle': { lat: 47.6062, lng: -122.3321 }
    };
    
    const cityKey = address.city.toLowerCase();
    return cityCoords[cityKey] || { lat: 39.8283, lng: -98.5795 }; // US center default
  }

  private simulateReverseGeocoding(coordinates: LocationCoordinates): StandardizedAddress {
    return {
      street: '123 Main St',
      city: 'Sample City',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
      formatted_address: '123 Main St, Sample City, CA 90210, USA'
    };
  }

  private calculateHaversineDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  private generateShippingOptions(distance: number, timeMinutes: number): ShippingOption[] {
    const baseTime = timeMinutes;
    return [
      {
        id: 'standard',
        name: 'Standard Shipping',
        cost: this.calculateBaseCost(distance),
        timeMinutes: baseTime + 2880, // +2 days
        carrier: 'USPS',
        trackingAvailable: true
      },
      {
        id: 'expedited',
        name: 'Expedited Shipping',
        cost: this.calculateBaseCost(distance) * 1.5,
        timeMinutes: baseTime + 1440, // +1 day
        carrier: 'UPS',
        trackingAvailable: true
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        cost: this.calculateBaseCost(distance) * 3,
        timeMinutes: baseTime + 720, // +12 hours
        carrier: 'FedEx',
        trackingAvailable: true
      }
    ];
  }

  private calculateBaseCost(distance: number): number {
    const baseCost = 5.99;
    const distanceCost = distance * 0.10;
    return Number((baseCost + distanceCost).toFixed(2));
  }

  private getDeliveryZone(coordinates: LocationCoordinates): ShippingZone | null {
    return this.shippingZones.find(zone => 
      this.isPointInZone(coordinates, zone) && zone.isActive
    ) || null;
  }

  private isPointInZone(point: LocationCoordinates, zone: ShippingZone): boolean {
    // Simplified zone checking (would use proper polygon containment in production)
    return zone.coordinates.some(coord => 
      this.calculateHaversineDistance(point, coord) <= 50
    );
  }

  private getTimezone(coordinates: LocationCoordinates | undefined): string {
    if (!coordinates) return 'UTC';
    
    // Simplified timezone detection
    if (coordinates.lng < -120) return 'America/Los_Angeles';
    if (coordinates.lng < -105) return 'America/Denver';
    if (coordinates.lng < -90) return 'America/Chicago';
    return 'America/New_York';
  }

  private getRegion(state: string): string {
    const regions: { [key: string]: string } = {
      'CA': 'West Coast',
      'NY': 'Northeast',
      'TX': 'South',
      'IL': 'Midwest'
    };
    return regions[state] || 'Other';
  }

  private detectAddressType(address: StandardizedAddress): 'business' | 'residential' | 'po_box' {
    if (address.street.toLowerCase().includes('po box')) return 'po_box';
    if (address.street.toLowerCase().includes('suite') || 
        address.street.toLowerCase().includes('ste') ||
        address.street.toLowerCase().includes('floor')) return 'business';
    return 'residential';
  }

  private initializeShippingZones(): void {
    this.shippingZones = [
      {
        id: 'west_coast',
        name: 'West Coast',
        coordinates: [{ lat: 37.7749, lng: -122.4194 }],
        deliveryTimeMinutes: 1440, // 1 day
        shippingCostMultiplier: 1.0,
        isActive: true
      },
      {
        id: 'east_coast',
        name: 'East Coast',
        coordinates: [{ lat: 40.7128, lng: -74.0060 }],
        deliveryTimeMinutes: 2880, // 2 days
        shippingCostMultiplier: 1.2,
        isActive: true
      }
    ];
  }

  private initializeVendorLocations(): void {
    this.vendorLocations = [
      {
        vendorId: 'amazon_sf',
        name: 'Amazon SF Warehouse',
        address: {
          street: '123 Warehouse St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94103',
          country: 'US'
        },
        coordinates: { lat: 37.7749, lng: -122.4194 },
        servicesArea: 100,
        shippingTimeMinutes: 720,
        isActive: true
      }
    ];
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all caches and reset service state
   */
  clearCache(): void {
    this.cache.clear();
    this.coordinates.clear();
    console.log('🌍 [UnifiedLocationService] Cache cleared');
  }

  /**
   * Get service status for debugging
   */
  getStatus() {
    return {
      cacheSize: this.cache.size,
      coordinatesCount: this.coordinates.size,
      shippingZones: this.shippingZones.length,
      vendorLocations: this.vendorLocations.length,
      googlePlacesStatus: googlePlacesService.getStatus()
    };
  }
}

// ================================
// Service Instance Export
// ================================

export const unifiedLocationService = new UnifiedLocationService();
export default unifiedLocationService;

// Expose service globally for debugging
if (typeof window !== 'undefined') {
  (window as any).unifiedLocationService = unifiedLocationService;
}