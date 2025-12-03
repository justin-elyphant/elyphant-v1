import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { useGeneralSettingsForm } from "@/hooks/settings/useGeneralSettingsForm";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import DataSharingSection from "./DataSharingSection";

/**
 * Wrapper component that provides form context for DataSharingSection
 * when used in PrivacySharingSettings (outside of GeneralSettings form)
 */
const DataSharingSectionWrapper: React.FC = () => {
  const {
    form,
    isSaving,
    loading,
    onSubmit,
    hasUnsavedChanges
  } = useGeneralSettingsForm();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sharing
        </CardTitle>
        <CardDescription>
          Control who can see your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (data) => {
            await onSubmit(data, "privacy");
          })} className="space-y-6">
            <DataSharingSection embedded />
            
            <div className="flex items-center justify-end pt-4 border-t">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-600 mr-4">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Unsaved changes
                </div>
              )}
              <Button 
                type="submit" 
                disabled={isSaving}
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
      </CardContent>
    </Card>
  );
};

export default DataSharingSectionWrapper;
