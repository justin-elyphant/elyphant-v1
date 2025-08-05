
import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, AlertCircle, Loader2, Bug } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { unifiedLocationService } from "@/services/location/UnifiedLocationService";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { AddressVerificationBadge } from "@/components/ui/AddressVerificationBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AddressSection = () => {
  const form = useFormContext();
  const { profile, updateProfile } = useUnifiedProfile();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    // Update all address fields when a place is selected
    form.setValue("address.street", standardizedAddress.street);
    form.setValue("address.city", standardizedAddress.city);
    form.setValue("address.state", standardizedAddress.state);
    form.setValue("address.zipCode", standardizedAddress.zipCode);
    form.setValue("address.country", standardizedAddress.country);
  };

  const handleVerifyAddress = async () => {
    const formData = form.getValues();
    const address = formData.address;
    
    if (!address?.street || !address?.city || !address?.state || !address?.zipCode) {
      toast.error("Please fill in all required address fields before verifying");
      return;
    }

    setIsVerifying(true);
    
    try {
      // Prepare address for validation
      const addressToValidate: StandardizedAddress = {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'US',
        formatted_address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
      };

      // Validate address using unified location service
      const validation = await unifiedLocationService.validateAddressForDelivery(addressToValidate);
      
      if (validation.isValid) {
        // Update profile with verification status
        console.log("🔍 Updating verification status:", {
          address_verified: true,
          address_verification_method: validation.confidence === 'high' ? 'automatic' : 'user_confirmed',
          address_verified_at: new Date().toISOString()
        });
        
        const result = await updateProfile({
          address_verified: true,
          address_verification_method: validation.confidence === 'high' ? 'automatic' : 'user_confirmed',
          address_verified_at: new Date().toISOString()
        });
        
        console.log("🔍 Verification update result:", result);
        
        if (result.success) {
          toast.success("Address verified successfully!", {
            description: validation.confidence === 'high' 
              ? "Your address was automatically verified with high confidence"
              : "Your address has been confirmed"
          });
          
          // Force a profile refresh to update UI immediately
          window.location.reload();
        } else {
          console.error("❌ Failed to update verification status:", result.error);
          toast.error("Failed to update verification status");
        }
      } else {
        // Show validation issues but allow manual confirmation
        const issuesList = validation.issues.join(", ");
        toast.error("Address validation failed", {
          description: `Issues found: ${issuesList}. Please review and correct your address.`
        });
        
        if (validation.suggestions.length > 0) {
          console.log("Address suggestions:", validation.suggestions);
        }
      }
    } catch (error) {
      console.error("Address verification error:", error);
      toast.error("Verification failed", {
        description: "Unable to verify address at this time. Please try again later."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestGooglePlaces = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-google-places', {
        body: { query: '422 Cribbage Lane San Marcos CA' }
      });
      
      if (error) {
        console.error('Test function error:', error);
        toast.error('Test failed', { description: error.message });
        return;
      }
      
      console.log('Google Places API Test Results:', data);
      
      if (data.success) {
        const issues = [];
        if (data.tests.geocoding.status !== 'OK') {
          issues.push(`Geocoding: ${data.tests.geocoding.status}`);
        }
        if (data.tests.placesAutocomplete.status !== 'OK') {
          issues.push(`Places Autocomplete: ${data.tests.placesAutocomplete.status}`);
        }
        
        if (issues.length > 0) {
          toast.error('API Issues Found', { 
            description: issues.join(', ') + '. Check console for details.' 
          });
        } else {
          toast.success('Google Places API is working!', {
            description: `Found ${data.tests.placesAutocomplete.predictionsCount} suggestions`
          });
        }
      } else {
        toast.error('API Test Failed', { description: data.error });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed', { description: 'See console for details' });
    } finally {
      setIsTesting(false);
    }
  };

  const getVerificationStatus = () => {
    if (!profile?.shipping_address) return null;
    
    const verified = profile.address_verified || false;
    const verifiedAt = profile.address_verified_at;
    const lastUpdated = profile.address_last_updated;
    
    // Check if address was updated after verification (needs re-verification)
    const isOutdated = verified && lastUpdated && verifiedAt && new Date(lastUpdated) > new Date(verifiedAt);
    
    return {
      verified,
      method: profile.address_verification_method || 'pending_verification',
      verifiedAt,
      lastUpdated,
      needsVerification: !verified || isOutdated
    };
  };

  const verificationStatus = getVerificationStatus();

  // Add event listener for verification trigger
  React.useEffect(() => {
    const handleVerificationEvent = () => {
      console.log("🔄 Verification event triggered from save button");
      handleVerifyAddress();
    };

    const addressSection = document.querySelector('[data-address-section]');
    if (addressSection) {
      addressSection.addEventListener('verifyAddress', handleVerificationEvent);
      return () => {
        addressSection.removeEventListener('verifyAddress', handleVerificationEvent);
      };
    }
  }, []);

  return (
    <Card data-address-section>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">My Address</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestGooglePlaces}
              disabled={isTesting}
              className="text-xs"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Bug className="h-3 w-3 mr-1" />
                  Test API
                </>
              )}
            </Button>
            {verificationStatus && (
              <AddressVerificationBadge
                verified={verificationStatus.verified}
                verificationMethod={verificationStatus.method}
                verifiedAt={verificationStatus.verifiedAt}
                lastUpdated={verificationStatus.lastUpdated}
                size="sm"
                showText={false}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="address.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <GooglePlacesAutocomplete
                  value={field.value || ""}
                  onChange={field.onChange}
                  onAddressSelect={handleGooglePlacesSelect}
                  placeholder="Start typing your address..."
                  label=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apartment, Suite, Unit, etc. (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apt 2B, Suite 100, Unit 4..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input placeholder="California" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address.zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP/Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="94103" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Verification Status */}
        {verificationStatus && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Address Verification</h4>
                  <AddressVerificationBadge
                    verified={verificationStatus.verified}
                    verificationMethod={verificationStatus.method}
                    verifiedAt={verificationStatus.verifiedAt}
                    lastUpdated={verificationStatus.lastUpdated}
                    size="sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {verificationStatus.verified
                    ? "Your address has been verified for delivery"
                    : "Use the 'Save & Verify Address' button below to save and verify your address"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressSection;
