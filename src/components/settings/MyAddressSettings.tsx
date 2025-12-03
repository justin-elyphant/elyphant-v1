import React from "react";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AddressSection from "./AddressSection";
import { unifiedLocationService } from "@/services/location/UnifiedLocationService";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";

const MyAddressSettings: React.FC = () => {
  const { updateProfile } = useUnifiedProfile();
  
  const {
    form,
    isSaving,
    loading,
    onSubmit,
    hasUnsavedChanges,
    refetchProfile,
    dataLoadError
  } = useGeneralSettingsForm();

  const handleAddressVerification = async (data: SettingsFormValues) => {
    const address = data.address;
    
    if (!address?.street || !address?.city || !address?.state || !address?.zipCode) {
      toast.error("Address is incomplete and cannot be verified");
      return;
    }

    try {
      const addressToValidate: StandardizedAddress = {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'US',
        formatted_address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
      };

      const validation = await unifiedLocationService.validateAddressForDelivery(addressToValidate);
      
      if (validation.isValid) {
        const result = await updateProfile({
          address_verified: true,
          address_verification_method: validation.confidence === 'high' ? 'automatic' : 'user_confirmed',
          address_verified_at: new Date().toISOString()
        });
        
        if (result.success) {
          toast.success("Address verified successfully!", {
            description: validation.confidence === 'high' 
              ? "Your address was automatically verified with high confidence"
              : "Your address has been confirmed"
          });
        } else {
          toast.error("Failed to update verification status");
        }
      } else {
        const issuesList = validation.issues.join(", ");
        toast.error("Address verification failed", {
          description: `Issues found: ${issuesList}. Please review and correct your address.`
        });
      }
    } catch (error) {
      console.error("Address verification error:", error);
      toast.error("Verification failed", {
        description: "Unable to verify address at this time. Please try again later."
      });
    }
  };

  const handleRetryLoad = async () => {
    try {
      await refetchProfile();
    } catch (error) {
      console.error("Error retrying profile load:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your address...</p>
        </div>
      </div>
    );
  }

  if (dataLoadError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile data: {dataLoadError}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryLoad}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-[calc(var(--bottom-nav-height,0px)+6rem)] md:pb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(async (data) => {
          try {
            const saveResult = await onSubmit(data, "address");
            if (saveResult?.success) {
              await handleAddressVerification(data);
            }
          } catch (error) {
            // Error handled in onSubmit
          }
        }, (errors) => {
          const errorFields = Object.keys(errors);
          toast.error("Please fix the following errors:", {
            description: errorFields.length > 0 
              ? `${errorFields.join(", ")} - Check all required fields are filled correctly.`
              : "Please check all fields and try again."
          });
        })} className="space-y-6">
          <AddressSection />
          
          <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-background pb-4 border-t mt-6">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                You have unsaved changes
              </div>
            )}
            <div className="flex-1" />
            <Button 
              type="submit" 
              disabled={isSaving}
              size="lg"
              className="min-w-[200px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving & Verifying...
                </>
              ) : (
                "Save & Verify Address"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MyAddressSettings;
