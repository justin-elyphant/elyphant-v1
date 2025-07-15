
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import DataSharingSection from "./DataSharingSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import InterestsFormSection from "./InterestsFormSection";
import GiftingPreferencesSection from "./GiftingPreferencesSection";
import ProfileDataIntegrityPanel from "./ProfileDataIntegrityPanel";
const GeneralSettings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("basic");
  
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
    isAutoSavingDates
  } = useGeneralSettingsForm();

  // Handle navigation from data integrity panel
  useEffect(() => {
    if (location.state?.fromDataIntegrity && location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state to prevent issues on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter out any invalid important dates
  const validImportantDates = (form.watch("importantDates") || []).filter(
    (date): date is { date: Date; description: string } => 
      date.date !== undefined && date.description !== undefined
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">General Settings</h2>
        <p className="text-gray-600">Manage your profile information and preferences</p>
      </div>

      {/* Profile Data Integrity Panel */}
      <ProfileDataIntegrityPanel />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("❌ Form validation errors:", errors);
        })} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="dates">Important Dates</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="gifting">Gifting</TabsTrigger>
              <TabsTrigger value="privacy">Data Sharing</TabsTrigger>
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
            
            <TabsContent value="gifting" className="mt-6">
              <GiftingPreferencesSection />
            </TabsContent>
            
            <TabsContent value="privacy" className="mt-6">
              <DataSharingSection />
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center justify-between">
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
              onClick={() => console.log("🔘 Save button clicked!")}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default GeneralSettings;
