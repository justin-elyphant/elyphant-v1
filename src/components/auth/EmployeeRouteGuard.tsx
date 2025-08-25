import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { EmployeeDetectionService } from '@/services/employee/EmployeeDetectionService';

interface EmployeeRouteGuardProps {
  children: React.ReactNode;
}

export const EmployeeRouteGuard: React.FC<EmployeeRouteGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAndRedirectIfNeeded = async () => {
      // Skip checks if still loading auth or already checking
      if (isLoading || isChecking || !user) {
        return;
      }

      setIsChecking(true);

      try {
        // Detect if user is an employee
        const detection = await EmployeeDetectionService.detectEmployee(user);
        const currentPath = location.pathname;

        // Log detection result in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Employee Route Guard:', {
            isEmployee: detection.isEmployee,
            reason: detection.reason,
            currentPath,
            userEmail: user.email
          });
        }

        // Handle employee accessing consumer paths
        if (detection.isEmployee && EmployeeDetectionService.isConsumerOnlyPath(currentPath)) {
          console.log('Redirecting employee from consumer path to Trunkline');
          navigate('/trunkline', { replace: true });
          return;
        }

        // Handle non-employee accessing employee paths (except login)
        if (!detection.isEmployee && EmployeeDetectionService.isEmployeeOnlyPath(currentPath)) {
          console.log('Redirecting non-employee from employee path to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

      } catch (error) {
        console.error('Employee Route Guard: Error during detection', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRedirectIfNeeded();
  }, [user, isLoading, location.pathname, navigate]); // Removed isChecking to prevent infinite loop

  // Show loading state while checking employee status
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};