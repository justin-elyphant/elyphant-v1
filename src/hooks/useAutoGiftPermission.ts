import { useState, useEffect } from 'react';
import { Connection } from '@/types/connections';
import { useAuth } from '@/contexts/auth';
import { autoGiftPermissionService, AutoGiftPermissionResult } from '@/services/autoGiftPermissionService';

export const useAutoGiftPermission = (connection: Connection | null) => {
  const { user } = useAuth();
  const [permissionResult, setPermissionResult] = useState<AutoGiftPermissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = async () => {
    if (!user || !connection) {
      setPermissionResult(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await autoGiftPermissionService.checkAutoGiftPermission(
        user.id, // Current logged-in user ID
        connection
      );
      
      setPermissionResult(result);
    } catch (err) {
      console.error('Error checking auto-gift permission:', err);
      setError('Failed to check auto-gift permission');
      setPermissionResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermission();
  }, [user?.id, connection?.id, connection?.dataStatus]);

  return {
    permissionResult,
    loading,
    error,
    refreshPermission: checkPermission
  };
};