import React from 'react';
import { useAuth } from '@/contexts/auth';
import { Navigate } from 'react-router-dom';
import EmailVerificationView from './signup/EmailVerificationView';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

/**
 * EmailVerificationGuard ensures users have verified their email
 * before accessing protected features
 */
const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If email is not confirmed, show verification view
  if (!user.email_confirmed_at) {
    console.log('EmailVerificationGuard: Email not verified, showing verification view');
    return <EmailVerificationView userEmail={user.email} />;
  }

  // Email is verified, allow access
  return <>{children}</>;
};

export default EmailVerificationGuard;