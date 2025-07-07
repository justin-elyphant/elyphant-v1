
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import BasicInfoSection from "./BasicInfoSection";
import AddressSection from "./AddressSection";
import DataSharingSection from "./DataSharingSection";
import ImportantDatesFormSection from "./ImportantDatesFormSection";
import InterestsFormSection from "./InterestsFormSection";
import GiftingPreferencesSection from "./GiftingPreferencesSection";
import ProfileDataIntegrityPanel from "./ProfileDataIntegrityPanel";
const GeneralSettings = () => {
  const { user } = useAuth();
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
    handleRemoveImportantDate
  } = useGeneralSettingsForm();

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
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
              />
            </TabsContent>
            
            <TabsContent value="interests" className="mt-6">
              <InterestsFormSection
                interests={form.watch("interests") || []}
                removeInterest={handleRemoveInterest}
                newInterest={newInterest}
                setNewInterest={setNewInterest}
                addInterest={handleAddInterest}
              />
            </TabsContent>
            
            <TabsContent value="gifting" className="mt-6">
              <GiftingPreferencesSection />
            </TabsContent>
            
            <TabsContent value="privacy" className="mt-6">
              <DataSharingSection />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
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
