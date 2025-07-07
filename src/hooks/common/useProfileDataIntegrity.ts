import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";

interface DataIntegrityIssue {
  field: string;
  issue: string;
  severity: 'warning' | 'error';
  autoFixable: boolean;
}

export function useProfileDataIntegrity() {
  const { user } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const [isChecking, setIsChecking] = useState(false);
  const [issues, setIssues] = useState<DataIntegrityIssue[]>([]);

  const checkDataIntegrity = useCallback(async (showToasts = true) => {
    if (!user || !profile) return [];

    setIsChecking(true);
    const foundIssues: DataIntegrityIssue[] = [];

    try {
      // Check for missing critical data
      if (!profile.name || profile.name.trim() === '') {
        foundIssues.push({
          field: 'name',
          issue: 'Name is missing or empty',
          severity: 'error',
          autoFixable: false
        });
      }

      if (!profile.email || profile.email.trim() === '') {
        foundIssues.push({
          field: 'email',
          issue: 'Email is missing',
          severity: 'error',
          autoFixable: false
        });
      }

      if (!profile.username || profile.username.trim() === '') {
        foundIssues.push({
          field: 'username',
          issue: 'Username is missing',
          severity: 'warning',
          autoFixable: false
        });
      }

      // Check data format issues
      if (profile.dob && typeof profile.dob === 'string') {
        const dobPattern = /^\d{2}-\d{2}$/;
        if (!dobPattern.test(profile.dob)) {
          foundIssues.push({
            field: 'dob',
            issue: 'Date of birth format is incorrect',
            severity: 'warning',
            autoFixable: false
          });
        }
      }

      // Check if shipping address is properly formatted
      if (profile.shipping_address && typeof profile.shipping_address === 'string') {
        foundIssues.push({
          field: 'shipping_address',
          issue: 'Shipping address is stored as string instead of object',
          severity: 'warning',
          autoFixable: true
        });
      }

      setIssues(foundIssues);

      if (showToasts) {
        if (foundIssues.length === 0) {
          toast.success("Profile data integrity check passed");
        } else {
          const errorCount = foundIssues.filter(i => i.severity === 'error').length;
          const warningCount = foundIssues.filter(i => i.severity === 'warning').length;
          
          if (errorCount > 0) {
            toast.error(`Found ${errorCount} critical issue(s) with your profile data`);
          } else if (warningCount > 0) {
            toast.warning(`Found ${warningCount} minor issue(s) with your profile data`);
          }
        }
      }

      return foundIssues;
    } catch (error) {
      console.error("Error checking data integrity:", error);
      if (showToasts) {
        toast.error("Failed to check profile data integrity");
      }
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [user, profile]);

  const refreshData = useCallback(async () => {
    try {
      await refetchProfile();
      toast.success("Profile data refreshed");
    } catch (error) {
      console.error("Error refreshing profile data:", error);
      toast.error("Failed to refresh profile data");
    }
  }, [refetchProfile]);

  return {
    issues,
    isChecking,
    checkDataIntegrity,
    refreshData,
    hasIssues: issues.length > 0,
    hasCriticalIssues: issues.some(i => i.severity === 'error')
  };
}