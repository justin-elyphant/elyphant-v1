import React from "react";
import { useAuth } from "@/contexts/auth";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import BasicInfoSection from "./BasicInfoSection";

const MyInfoSettings: React.FC = () => {
  const { user } = useAuth();
  
  const {
    form,
    isSaving,
    loading,
    onSubmit,
    hasUnsavedChanges,
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
          <p className="text-muted-foreground">Loading your info...</p>
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
            await onSubmit(data, "basic");
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
          <BasicInfoSection user={user} />
          
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

export default MyInfoSettings;
