
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from "lucide-react";
import { useConsistentProfile } from "@/hooks/useConsistentProfile";
import { useAuth } from "@/contexts/auth";
import { normalizeDataSharingSettings } from "@/utils/privacyUtils";
import { supabase } from "@/integrations/supabase/client";

const DataFlowTester: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, error, isValidated, updateProfile, refetchProfile } = useConsistentProfile();
  const [testResults, setTestResults] = useState<{
    status: "idle" | "running" | "success" | "failed";
    results: Array<{ name: string; success: boolean; message: string }>;
  }>({
    status: "idle",
    results: []
  });

  // Run tests on component mount if we have a user
  useEffect(() => {
    if (user && !loading && isValidated) {
      runTests();
    }
  }, [user, loading, isValidated]);

  const addTestResult = (name: string, success: boolean, message: string) => {
    setTestResults(prev => ({
      ...prev,
      results: [...prev.results, { name, success, message }]
    }));
  };

  const runTests = async () => {
    setTestResults({
      status: "running",
      results: []
    });
    
    try {
      // Test 1: Check if user exists
      if (user) {
        addTestResult("User Authentication", true, "User is authenticated");
      } else {
        addTestResult("User Authentication", false, "No authenticated user found");
        setTestResults(prev => ({ ...prev, status: "failed" }));
        return;
      }
      
      // Test 2: Check if profile data was fetched
      if (profile) {
        addTestResult("Profile Fetch", true, "Profile data loaded successfully");
      } else {
        addTestResult("Profile Fetch", false, "Failed to load profile data");
        setTestResults(prev => ({ ...prev, status: "failed" }));
        return;
      }
      
      // Test 3: Check data sharing settings
      const hasDataSharingSettings = profile.data_sharing_settings && 
                                    typeof profile.data_sharing_settings === 'object' &&
                                    Object.keys(profile.data_sharing_settings).length > 0;
      
      if (hasDataSharingSettings) {
        // Check if normalized correctly
        const normalized = normalizeDataSharingSettings(profile.data_sharing_settings);
        const isComplete = normalized.dob && normalized.shipping_address && 
                        normalized.gift_preferences && normalized.email === 'private';
                        
        if (isComplete) {
          addTestResult("Data Sharing Settings", true, "Data sharing settings are complete and normalized");
        } else {
          addTestResult("Data Sharing Settings", false, "Data sharing settings need normalization");
          
          // Try to fix data sharing settings
          try {
            await updateProfile({ 
              data_sharing_settings: normalized
            });
            addTestResult("Auto-fix Data Sharing", true, "Data sharing settings normalized automatically");
          } catch (e) {
            addTestResult("Auto-fix Data Sharing", false, "Failed to normalize data sharing settings");
          }
        }
      } else {
        addTestResult("Data Sharing Settings", false, "Missing data sharing settings");
      }
      
      // Test 4: Check if we can update profile data
      try {
        const testUpdateField = `test_${Date.now()}`;
        await updateProfile({ 
          updated_at: new Date().toISOString()
        });
        addTestResult("Profile Updates", true, "Successfully updated profile data");
      } catch (e) {
        addTestResult("Profile Updates", false, "Failed to update profile data");
      }
      
      // Test 5: Check if we can fetch updated profile
      try {
        const refreshed = await refetchProfile();
        if (refreshed) {
          addTestResult("Profile Refresh", true, "Successfully refreshed profile data");
        } else {
          addTestResult("Profile Refresh", false, "Failed to refresh profile data");
        }
      } catch (e) {
        addTestResult("Profile Refresh", false, `Error refreshing profile: ${e}`);
      }
      
      // Set overall status based on results
      const hasFailures = testResults.results.some(result => !result.success);
      setTestResults(prev => ({ 
        ...prev, 
        status: hasFailures ? "failed" : "success" 
      }));
      
    } catch (error) {
      console.error("Error running tests:", error);
      addTestResult("Test Runner", false, `Unexpected error: ${error}`);
      setTestResults(prev => ({ ...prev, status: "failed" }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Flow Diagnostic</CardTitle>
          <CardDescription>Testing data flow across the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load profile data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Data Flow Diagnostic
          {testResults.status === "success" && <Badge className="bg-green-500">Passed</Badge>}
          {testResults.status === "failed" && <Badge variant="destructive">Issues Found</Badge>}
          {testResults.status === "running" && <Badge variant="secondary">Running</Badge>}
        </CardTitle>
        <CardDescription>
          Testing data flow and storage consistency across the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        {testResults.results.length > 0 ? (
          <div className="space-y-3">
            {testResults.results.map((result, index) => (
              <div key={index} className="flex items-start gap-2 border-b pb-2">
                {result.success ? (
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {testResults.status === "idle" ? "Click Run Tests to start the diagnostic" : "Running tests..."}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runTests} 
          disabled={testResults.status === "running" || loading}
          className="w-full"
        >
          {testResults.status === "running" ? "Running Tests..." : "Run Tests"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataFlowTester;
