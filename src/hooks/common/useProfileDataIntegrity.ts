import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useWishlists } from "@/components/gifting/hooks/useWishlists";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DataIntegrityIssue {
  field: string;
  issue: string;
  severity: 'critical' | 'important' | 'helpful';
  autoFixable: boolean;
  targetTab?: string;
  aiImpact: string;
}

export function useProfileDataIntegrity() {
  const { user } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const { connections } = useEnhancedConnections();
  const { wishlists } = useWishlists();
  const [isChecking, setIsChecking] = useState(false);
  const [issues, setIssues] = useState<DataIntegrityIssue[]>([]);
  const [completionScore, setCompletionScore] = useState(0);

  const checkDataIntegrity = useCallback(async (showToasts = true, formValues?: any) => {
    if (!user || !profile) return [];
    
    // Use form values if provided, otherwise use profile data
    const dataToCheck = formValues || profile;

    setIsChecking(true);
    const foundIssues: DataIntegrityIssue[] = [];
    let score = 0;

    try {
      // === CRITICAL ALERTS (30 points) ===
      // Basic profile info (name, email) - Essential for account function
      if (!dataToCheck.name || dataToCheck.name.trim() === '') {
        foundIssues.push({
          field: 'name',
          issue: 'Add your name',
          severity: 'critical',
          autoFixable: false,
          targetTab: 'basic',
          aiImpact: 'Required for personalized AI recommendations'
        });
      } else {
        score += 15;
      }

      if (!dataToCheck.email || dataToCheck.email.trim() === '') {
        foundIssues.push({
          field: 'email',
          issue: 'Email is missing',
          severity: 'critical',
          autoFixable: false,
          targetTab: 'basic',
          aiImpact: 'Required for account security and notifications'
        });
      } else {
        score += 15;
      }

      // === IMPORTANT ALERTS (60 points total) ===
      // Important dates (20 points)
      const importantDates = dataToCheck.importantDates || dataToCheck.important_dates;
      const dateCount = Array.isArray(importantDates) ? importantDates.length : 0;
      
      if (dateCount === 0) {
        foundIssues.push({
          field: 'important_dates',
          issue: 'Add important dates (birthdays, anniversaries)',
          severity: 'important',
          autoFixable: false,
          targetTab: 'dates',
          aiImpact: 'Essential for auto-gifting and gift timing recommendations'
        });
      } else if (dateCount < 2) {
        foundIssues.push({
          field: 'important_dates',
          issue: 'Add more important dates for better gift planning',
          severity: 'important',
          autoFixable: false,
          targetTab: 'dates',
          aiImpact: 'More dates improve auto-gifting accuracy'
        });
        score += 10;
      } else {
        score += 20;
      }

      // Interests (20 points)
      const interests = dataToCheck.interests;
      const interestCount = Array.isArray(interests) ? interests.length : 0;
      
      if (interestCount === 0) {
        foundIssues.push({
          field: 'interests',
          issue: 'Add your interests and hobbies',
          severity: 'important',
          autoFixable: false,
          targetTab: 'interests',
          aiImpact: 'Critical for personalized gift recommendations'
        });
      } else if (interestCount < 3) {
        foundIssues.push({
          field: 'interests',
          issue: 'Add more interests for better recommendations',
          severity: 'helpful',
          autoFixable: false,
          targetTab: 'interests',
          aiImpact: 'More interests = better gift suggestions'
        });
        score += 10;
      } else {
        score += 20;
      }

      // Wishlists (15 points)
      const wishlistCount = Array.isArray(wishlists) ? wishlists.length : 0;
      
      if (wishlistCount === 0) {
        foundIssues.push({
          field: 'wishlists',
          issue: 'Create your first wishlist',
          severity: 'important',
          autoFixable: false,
          aiImpact: 'Wishlists help friends see what you want and improve gift recommendations'
        });
      } else {
        score += 15;
      }

      // Connections (10 points)
      const acceptedConnections = connections.filter(c => c.status === 'accepted').length;
      
      if (acceptedConnections === 0) {
        foundIssues.push({
          field: 'connections',
          issue: 'Add your first connection',
          severity: 'important',
          autoFixable: false,
          targetTab: 'connections',
          aiImpact: 'Connections enable auto-gifting and shared wishlists'
        });
      } else if (acceptedConnections < 3) {
        foundIssues.push({
          field: 'connections',
          issue: 'Connect with more friends and family',
          severity: 'helpful',
          autoFixable: false,
          targetTab: 'connections',
          aiImpact: 'More connections improve gift recommendations'
        });
        score += 5;
      } else {
        score += 10;
      }

      // === HELPFUL ALERTS (25 points total) ===
      // Shipping address (10 points)
      const shippingAddress = dataToCheck.address || dataToCheck.shipping_address;
      
      // Debug logging for address validation
      console.log('Address validation debug:', {
        dataToCheck: dataToCheck,
        shippingAddress: shippingAddress,
        hasAddress: !!shippingAddress,
        addressType: typeof shippingAddress
      });
      
      // Check if address is complete - handle different field name variations
      let isAddressComplete = false;
      if (shippingAddress && typeof shippingAddress === 'object') {
        const street = shippingAddress.street || shippingAddress.address_line1;
        const city = shippingAddress.city;
        const state = shippingAddress.state;
        const zipCode = shippingAddress.zipCode || shippingAddress.zip_code;
        
        console.log('Address fields check:', {
          street, city, state, zipCode,
          streetExists: !!street?.trim(),
          cityExists: !!city?.trim(),
          stateExists: !!state?.trim(),
          zipExists: !!zipCode?.trim()
        });
        
        isAddressComplete = !!(street?.trim() && city?.trim() && state?.trim() && zipCode?.trim());
      }
      
      console.log('Is address complete:', isAddressComplete);
      
      if (!isAddressComplete) {
        foundIssues.push({
          field: 'shipping_address',
          issue: 'Complete your shipping address',
          severity: 'helpful',
          autoFixable: true,
          targetTab: 'address',
          aiImpact: 'Required for receiving auto-gifts and deliveries'
        });
      } else {
        score += 10;
      }

      // Date of birth (5 points)
      const dob = dataToCheck.birthday || dataToCheck.dob;
      if (!dob) {
        foundIssues.push({
          field: 'dob',
          issue: 'Add your date of birth',
          severity: 'helpful',
          autoFixable: false,
          targetTab: 'basic',
          aiImpact: 'Helps provide age-appropriate gift recommendations'
        });
      } else if (dob && typeof dob === 'string') {
        const dobPattern = /^\d{2}-\d{2}$/;
        if (!dobPattern.test(dob)) {
          foundIssues.push({
            field: 'dob',
            issue: 'Date of birth format needs fixing',
            severity: 'helpful',
            autoFixable: false,
            targetTab: 'basic',
            aiImpact: 'Proper format improves gift timing accuracy'
          });
        } else {
          score += 5;
        }
      } else {
        score += 5;
      }

      // Username (5 points)
      if (!dataToCheck.username || dataToCheck.username.trim() === '') {
        foundIssues.push({
          field: 'username',
          issue: 'Choose a username',
          severity: 'helpful',
          autoFixable: false,
          targetTab: 'basic',
          aiImpact: 'Makes it easier for friends to find you'
        });
      } else {
        score += 5;
      }

      // Bio (5 points)
      if (!dataToCheck.bio || dataToCheck.bio.trim() === '') {
        foundIssues.push({
          field: 'bio',
          issue: 'Add a bio to your profile',
          severity: 'helpful',
          autoFixable: false,
          targetTab: 'basic',
          aiImpact: 'Provides context for better personalization'
        });
      } else {
        score += 5;
      }

      setIssues(foundIssues);
      setCompletionScore(score);

      if (showToasts) {
        if (foundIssues.length === 0) {
          toast.success("Profile optimization complete - AI ready!");
        } else {
          const criticalCount = foundIssues.filter(i => i.severity === 'critical').length;
          const importantCount = foundIssues.filter(i => i.severity === 'important').length;
          
          if (criticalCount > 0) {
            toast.error(`${criticalCount} critical item(s) needed for full functionality`);
          } else if (importantCount > 0) {
            toast.warning(`${importantCount} important item(s) will improve AI recommendations`);
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
  }, [user, profile, connections, wishlists]);

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
    completionScore,
    hasIssues: issues.length > 0,
    hasCriticalIssues: issues.some(i => i.severity === 'critical'),
    hasImportantIssues: issues.some(i => i.severity === 'important'),
    hasHelpfulIssues: issues.some(i => i.severity === 'helpful')
  };
}