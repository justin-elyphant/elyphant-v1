-- Enhanced location tables for UnifiedLocationService
CREATE TABLE public.vendor_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address JSONB NOT NULL,
  coordinates JSONB NOT NULL, -- {lat: number, lng: number}
  service_area_miles INTEGER NOT NULL DEFAULT 50,
  shipping_time_minutes INTEGER NOT NULL DEFAULT 1440,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.shipping_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL, -- Array of {lat: number, lng: number}
  delivery_time_minutes INTEGER NOT NULL DEFAULT 1440,
  shipping_cost_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.location_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_data JSONB NOT NULL,
  cache_type TEXT NOT NULL, -- 'geocoding', 'reverse_geocoding', 'distance', etc.
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced address intelligence table for better address validation
ALTER TABLE public.address_intelligence 
ADD COLUMN IF NOT EXISTS coordinates JSONB,
ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES public.shipping_zones(id),
ADD COLUMN IF NOT EXISTS address_type TEXT CHECK (address_type IN ('business', 'residential', 'po_box')),
ADD COLUMN IF NOT EXISTS is_valid_for_delivery BOOLEAN DEFAULT true;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_vendor_locations_coordinates ON public.vendor_locations USING gin(coordinates);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_coordinates ON public.shipping_zones USING gin(coordinates);
CREATE INDEX IF NOT EXISTS idx_location_cache_key ON public.location_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_location_cache_expires ON public.location_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_address_intelligence_coordinates ON public.address_intelligence USING gin(coordinates);

-- Enable RLS
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_locations
CREATE POLICY "Anyone can view active vendor locations" 
ON public.vendor_locations 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage vendor locations" 
ON public.vendor_locations 
FOR ALL 
USING (true);

-- RLS Policies for shipping_zones
CREATE POLICY "Anyone can view active shipping zones" 
ON public.shipping_zones 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage shipping zones" 
ON public.shipping_zones 
FOR ALL 
USING (true);

-- RLS Policies for location_cache
CREATE POLICY "Users can access location cache" 
ON public.location_cache 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage location cache" 
ON public.location_cache 
FOR ALL 
USING (true);

-- Insert sample shipping zones
INSERT INTO public.shipping_zones (name, coordinates, delivery_time_minutes, shipping_cost_multiplier) VALUES
('West Coast Express', '[{"lat": 37.7749, "lng": -122.4194}, {"lat": 34.0522, "lng": -118.2437}, {"lat": 47.6062, "lng": -122.3321}]', 1440, 1.0),
('East Coast Standard', '[{"lat": 40.7128, "lng": -74.0060}, {"lat": 42.3601, "lng": -71.0589}, {"lat": 38.9072, "lng": -77.0369}]', 1440, 1.1),
('Central Zone', '[{"lat": 41.8781, "lng": -87.6298}, {"lat": 32.7767, "lng": -96.7970}, {"lat": 39.1612, "lng": -75.5264}]', 2160, 1.2);

-- Insert sample vendor locations
INSERT INTO public.vendor_locations (vendor_id, name, address, coordinates, service_area_miles, shipping_time_minutes) VALUES
('amazon', 'Amazon Fulfillment SF', '{"street": "123 Warehouse Way", "city": "San Francisco", "state": "CA", "zipCode": "94105"}', '{"lat": 37.7749, "lng": -122.4194}', 100, 720),
('target', 'Target Distribution LA', '{"street": "456 Supply Chain Blvd", "city": "Los Angeles", "state": "CA", "zipCode": "90001"}', '{"lat": 34.0522, "lng": -118.2437}', 75, 1440),
('walmart', 'Walmart Fulfillment NY', '{"street": "789 Logistics Ave", "city": "New York", "state": "NY", "zipCode": "10001"}', '{"lat": 40.7128, "lng": -74.0060}', 150, 1080);

-- Add trigger for automatic cache cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_location_cache()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM public.location_cache WHERE expires_at < now();
  RETURN NULL;
END;
$function$;

CREATE TRIGGER cleanup_location_cache_trigger
AFTER INSERT ON public.location_cache
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_location_cache();