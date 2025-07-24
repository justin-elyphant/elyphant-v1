/**
 * Hook for accessing auto-gifting protection statistics and controls
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { protectedAutoGiftingService } from '@/services/protected-auto-gifting-service';
import { toast } from 'sonner';

export const useAutoGiftingProtection = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [userRateLimit, setUserRateLimit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProtectionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const protectionStats = protectedAutoGiftingService.getServiceStatistics();
      const userStatus = user ? protectedAutoGiftingService.getUserRateLimitStatus(user.id) : null;
      
      setStats(protectionStats);
      setUserRateLimit(userStatus);
    } catch (err) {
      console.error('Error loading protection data:', err);
      setError('Failed to load protection statistics');
      toast.error('Failed to load protection statistics');
    } finally {
      setLoading(false);
    }
  };

  const checkCanExecuteAutoGift = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      // Check emergency circuit breaker
      const canProceed = await protectedAutoGiftingService.checkEmergencyCircuitBreaker();
      if (!canProceed) return false;
      
      // Check rate limits
      const userStatus = protectedAutoGiftingService.getUserRateLimitStatus(userId);
      return userStatus.executionsRemaining > 0;
    } catch (error) {
      console.error('Error checking auto-gift execution permission:', error);
      return false;
    }
  };

  const resetMonthlyTracking = async () => {
    try {
      protectedAutoGiftingService.resetMonthlyTracking();
      await loadProtectionData();
      toast.success('Monthly tracking reset successfully');
    } catch (error) {
      console.error('Error resetting monthly tracking:', error);
      toast.error('Failed to reset monthly tracking');
    }
  };

  const getBudgetAllocation = () => {
    return protectedAutoGiftingService.getBudgetAllocation();
  };

  const isPriorityOccasion = (occasion: string): boolean => {
    return protectedAutoGiftingService.isPriorityOccasion(occasion);
  };

  useEffect(() => {
    loadProtectionData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadProtectionData, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    stats,
    userRateLimit,
    loading,
    error,
    checkCanExecuteAutoGift,
    resetMonthlyTracking,
    getBudgetAllocation,
    isPriorityOccasion,
    refreshData: loadProtectionData
  };
};