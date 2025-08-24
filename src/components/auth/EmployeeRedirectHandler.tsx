import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

/**
 * Handles automatic redirection for employees after OAuth completion
 * This component should be rendered at the app level to catch post-OAuth redirects
 */
export const EmployeeRedirectHandler: React.FC = () => {
  const { user, isLoading, isEmployee } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only process if we have a user and employee status is determined
    if (!user || isLoading || isEmployee === null) {
      return;
    }

    // Check if there's a pending employee redirect
    const pendingRedirect = localStorage.getItem('pendingEmployeeRedirect');
    const redirectReason = localStorage.getItem('employeeRedirectReason');

    if (pendingRedirect === 'true' && isEmployee) {
      console.log('Processing pending employee redirect after OAuth', {
        reason: redirectReason,
        currentPath: location.pathname,
        userEmail: user.email
      });

      // Clear the flags
      localStorage.removeItem('pendingEmployeeRedirect');
      localStorage.removeItem('employeeRedirectReason');

      // Only redirect if not already on a Trunkline path
      if (!location.pathname.startsWith('/trunkline')) {
        navigate('/trunkline', { replace: true });
      }
    }
  }, [user, isLoading, isEmployee, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};