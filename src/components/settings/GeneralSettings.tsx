
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import DataSharingSection from "./DataSharingSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import InterestsFormSection from "./InterestsFormSection";
import { unifiedLocationService } from "@/services/location/UnifiedLocationService";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";

const GeneralSettings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("basic");
  const { updateProfile } = useUnifiedProfile();
  
  const {
    form,
    isSaving,
    loading,
    newInterest,
    setNewInterest,
    newImportantDate,
    setNewImportantDate,
    onSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate,
    hasUnsavedChanges,
    isAutoSavingInterests,
    isAutoSavingDates,
    refetchProfile,
    dataLoadError
  } = useGeneralSettingsForm();

  // Handle address verification after successful save
  const handleAddressVerification = async (data: SettingsFormValues) => {
    const address = data.address;
    
    if (!address?.street || !address?.city || !address?.state || !address?.zipCode) {
      toast.error("Address is incomplete and cannot be verified");
      return;
    }

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
        // Show validation issues but allow manual confirmation
        const issuesList = validation.issues.join(", ");
        toast.error("Address verification failed", {
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
    }
  };

  console.log("🔄 GeneralSettings rendered");
  console.log("📊 Form state:", { loading, isSaving, hasUnsavedChanges, dataLoadError });

  // Debug form values
  const currentFormValues = form.watch();
  console.log("🔍 Current form values in GeneralSettings:", {
    first_name: currentFormValues.first_name,
    last_name: currentFormValues.last_name,
    date_of_birth: currentFormValues.date_of_birth,
    address: currentFormValues.address,
    interests_count: currentFormValues.interests?.length || 0,
    important_dates_count: currentFormValues.importantDates?.length || 0
  });

  // Handle navigation from data integrity panel
  useEffect(() => {
    if (location.state?.fromDataIntegrity && location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state to prevent issues on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleRetryLoad = async () => {
    console.log("🔄 Retrying profile data load...");
    try {
      await refetchProfile();
    } catch (error) {
      console.error("❌ Error retrying profile load:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  // Show data load error if there is one
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

  // Filter out any invalid important dates
  const validImportantDates = (form.watch("importantDates") || []).filter(
    (date): date is { date: Date; description: string } => 
      date.date !== undefined && date.description !== undefined
  );

  return (
    <div className="space-y-6 pb-[calc(var(--bottom-nav-height,0px)+6rem)] md:pb-6">
      <div>
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <p className="text-gray-600">Manage your profile information and preferences</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(async (data) => {
          console.log("✅ Form submission triggered with data:", data);
          try {
            const saveResult = await onSubmit(data, activeTab);
            
            // If this is the address tab and save was successful, trigger verification
            if (activeTab === "address" && saveResult?.success) {
              await handleAddressVerification(data);
            }
          } catch (error) {
            // Error already handled in onSubmit
          }
        }, (errors) => {
          console.log("❌ Form validation errors:", errors);
          console.log("❌ Detailed validation errors:", JSON.stringify(errors, null, 2));
          console.log("❌ Form state:", form.formState);
          
          // Show toast with validation errors
          const errorFields = Object.keys(errors);
          const firstError = errors[errorFields[0] as keyof typeof errors];
          
          toast.error("Please fix the following errors:", {
            description: errorFields.length > 0 
              ? `${errorFields.join(", ")} - Check all required fields are filled correctly.`
              : "Please check all fields and try again."
          });
        })} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">My Info</TabsTrigger>
              <TabsTrigger value="address">My Address</TabsTrigger>
              <TabsTrigger value="dates">My Events</TabsTrigger>
              <TabsTrigger value="interests">My Interests</TabsTrigger>
              <TabsTrigger value="privacy">My Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-6">
              <BasicInfoSection user={user} />
            </TabsContent>
            
            <TabsContent value="address" className="mt-6">
              <AddressSection />
            </TabsContent>
            
            <TabsContent value="dates" className="mt-6">
              <ImportantDatesFormSection
                importantDates={validImportantDates}
                removeImportantDate={handleRemoveImportantDate}
                newImportantDate={newImportantDate}
                setNewImportantDate={setNewImportantDate}
                addImportantDate={handleAddImportantDate}
                isAutoSaving={isAutoSavingDates}
              />
            </TabsContent>
            
            <TabsContent value="interests" className="mt-6">
              <InterestsFormSection
                interests={form.watch("interests") || []}
                removeInterest={handleRemoveInterest}
                newInterest={newInterest}
                setNewInterest={setNewInterest}
                addInterest={handleAddInterest}
                isAutoSaving={isAutoSavingInterests}
              />
            </TabsContent>
            
            <TabsContent value="privacy" className="mt-6">
              <DataSharingSection />
            </TabsContent>
          </Tabs>
          
          {/* Show validation errors if any */}
          {Object.keys(form.formState.errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Please fix the following errors:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      <strong>{field.replace(/_/g, ' ')}:</strong> {error?.message?.toString() || 'Invalid value'}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Hide save button for auto-saving tabs */}
          {activeTab !== "interests" && activeTab !== "dates" && (
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
                onClick={async (e) => {
                  console.log("🔘 Save button clicked!");
                  console.log("🔍 Active tab:", activeTab);
                  
                  if (activeTab === "address") {
                    e.preventDefault(); // Prevent form submission
                    
                    // Trigger validation and submit manually for address tab
                    const isValid = await form.trigger();
                    if (isValid) {
                      const formData = form.getValues();
                      console.log("🔄 Starting save & verify process...");
                      
                      // First save the form data
                      const saveResult = await onSubmit(formData, "address");
                      
                      if (saveResult?.success) {
                        console.log("✅ Form saved, now triggering verification...");
                        // Get the AddressSection component's verify function
                        const addressSection = document.querySelector('[data-address-section]');
                        if (addressSection) {
                          // Trigger verification event
                          const event = new CustomEvent('verifyAddress');
                          addressSection.dispatchEvent(event);
                        }
                      }
                    }
                  }
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {activeTab === "address" ? "Saving & Verifying..." : "Saving..."}
                  </>
                ) : (
                  activeTab === "address" ? "Save & Verify Address" : "Save Changes"
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default GeneralSettings;
