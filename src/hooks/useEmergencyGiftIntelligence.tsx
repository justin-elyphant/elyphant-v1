import { useState } from 'react';
import { useAuthSession } from '@/contexts/auth/useAuthSession';
import { EnhancedGiftIntelligenceService } from '@/services/ai/enhancedGiftIntelligenceService';

export const useEmergencyGiftIntelligence = () => {
  const { user } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [emergencyProfile, setEmergencyProfile] = useState<any>(null);

  // Enhanced invitation context analysis for new users
  const analyzeInvitationContext = async (recipientIdentifier: string) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const context = await EnhancedGiftIntelligenceService.getInvitationContextIntelligence(
        user.id, 
        recipientIdentifier
      );
      
      if (context) {
        console.log('🆕 Invitation context detected:', context);
        return context;
      }
      
      return null;
    } catch (error) {
      console.error('Error analyzing invitation context:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create emergency recipient profile for new/invited users
  const createEmergencyProfile = async (recipientIdentifier: string, invitationContext: any) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const profile = await EnhancedGiftIntelligenceService.createEmergencyRecipientProfile(
        user.id,
        recipientIdentifier,
        invitationContext
      );
      
      setEmergencyProfile(profile);
      console.log('🆘 Emergency profile created:', profile);
      return profile;
    } catch (error) {
      console.error('Error creating emergency profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced gift selection for new users with limited data
  const enhanceGiftSelectionForNewUser = async (
    recipientId: string, 
    occasion: string, 
    budget: number
  ) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const enhancedCriteria = await EnhancedGiftIntelligenceService.enhanceGiftSelectionForNewUser(
        user.id,
        recipientId,
        occasion,
        budget
      );
      
      console.log('🎯 Enhanced selection criteria for new user:', enhancedCriteria);
      return enhancedCriteria;
    } catch (error) {
      console.error('Error enhancing gift selection:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check if a recipient appears to be a new/invited user
  const isNewOrInvitedUser = async (recipientIdentifier: string) => {
    if (!user) return false;
    
    try {
      const context = await analyzeInvitationContext(recipientIdentifier);
      return !!(context?.is_emergency_scenario || context?.invitation_data);
    } catch (error) {
      console.error('Error checking new user status:', error);
      return false;
    }
  };

  // Generate emergency gift recommendations
  const generateEmergencyRecommendations = async (
    recipientIdentifier: string,
    occasion: string,
    budget: number,
    urgencyLevel: number = 7
  ) => {
    if (!user) return null;
    
    setLoading(true);
    try {
      // First analyze invitation context
      const invitationContext = await analyzeInvitationContext(recipientIdentifier);
      
      // Create emergency profile if needed
      if (invitationContext) {
        await createEmergencyProfile(recipientIdentifier, invitationContext);
      }
      
      // Get enhanced selection criteria
      const enhancedCriteria = await enhanceGiftSelectionForNewUser(
        recipientIdentifier,
        occasion,
        budget
      );
      
      return {
        invitationContext,
        emergencyProfile,
        enhancedCriteria,
        isEmergencyScenario: urgencyLevel <= 7 || !!invitationContext?.is_emergency_scenario
      };
    } catch (error) {
      console.error('Error generating emergency recommendations:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    emergencyProfile,
    analyzeInvitationContext,
    createEmergencyProfile,
    enhanceGiftSelectionForNewUser,
    isNewOrInvitedUser,
    generateEmergencyRecommendations,
  };
};