
import React, { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
        const verificationData = {
          address_verified: true,
          address_verification_method: validation.confidence === 'high' ? 'automatic' : 'user_confirmed',
          address_verified_at: new Date().toISOString()
        };
        
        console.log("🔍 Updating verification status:", verificationData);
        
        const result = await updateProfile(verificationData);
        
        console.log("🔍 Verification update result:", result);
        console.log("🔍 Making direct database check...");
        
        // Let's verify the update worked by checking the database directly
        const { data: checkData } = await supabase
          .from('profiles')
          .select('address_verified, address_verification_method, address_verified_at')
          .eq('id', profile?.id)
          .single();
        
        console.log("🔍 Database verification check:", checkData);
        
        if (result.success) {
          toast.success("Address verified successfully!", {
            description: validation.confidence === 'high' 
              ? "Your address was automatically verified with high confidence"
              : "Your address has been confirmed"
          });
          
          // Give a moment for the database to update, then refresh
          setTimeout(() => {
            window.location.reload();
          }, 2000);
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
