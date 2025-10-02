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
      // Skip checks if still loading auth or no user
      if (isLoading || !user) {
        return;
      }

      const currentPath = location.pathname;
      
      // Only check if user is trying to access Trunkline (employee-only area)
      if (EmployeeDetectionService.isEmployeeOnlyPath(currentPath)) {
        setIsChecking(true);
        
        try {
          // Detect if user is an employee
          const detection = await EmployeeDetectionService.detectEmployee(user);

          // Log detection result in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Employee Route Guard - Trunkline Access Check:', {
              isEmployee: detection.isEmployee,
              reason: detection.reason,
              currentPath,
              userEmail: user.email
            });
          }

          // Only redirect non-employees away from Trunkline
          if (!detection.isEmployee) {
            console.log('Redirecting non-employee from Trunkline to dashboard');
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (error) {
          console.error('Employee Route Guard: Error during detection', error);
          // On error, allow navigation to continue for safety
          console.log('Error occurred, allowing navigation to continue');
        } finally {
          setIsChecking(false);
        }
      }
      
      // For consumer paths: no checks needed, render normally
      // Employees can access both Trunkline AND consumer features (additive permissions)
    };

    checkAndRedirectIfNeeded();
  }, [user, isLoading, location.pathname, navigate]);

  // Only show loading state when actively checking Trunkline access
  // This prevents breaking the component tree for regular marketplace navigation
  if (isChecking && EmployeeDetectionService.isEmployeeOnlyPath(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};