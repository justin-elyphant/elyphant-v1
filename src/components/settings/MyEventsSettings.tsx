import React from "react";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ImportantDatesFormSection from "./ImportantDatesFormSection";

const MyEventsSettings: React.FC = () => {
  const {
    form,
    loading,
    newImportantDate,
    setNewImportantDate,
    handleAddImportantDate,
    handleRemoveImportantDate,
    isAutoSavingDates,
    refetchProfile,
    dataLoadError
  } = useGeneralSettingsForm();

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
          <p className="text-muted-foreground">Loading your events...</p>
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

  // Filter out any invalid important dates
  const validImportantDates = (form.watch("importantDates") || []).filter(
    (date): date is { date: Date; description: string } => 
      date.date !== undefined && date.description !== undefined
  );

  return (
    <div className="space-y-6 pb-[calc(var(--bottom-nav-height,0px)+6rem)] md:pb-6">
      <Form {...form}>
        <ImportantDatesFormSection
          importantDates={validImportantDates}
          removeImportantDate={handleRemoveImportantDate}
          newImportantDate={newImportantDate}
          setNewImportantDate={setNewImportantDate}
          addImportantDate={handleAddImportantDate}
          isAutoSaving={isAutoSavingDates}
        />
      </Form>
    </div>
  );
};

export default MyEventsSettings;
