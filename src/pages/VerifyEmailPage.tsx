import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/auth';
import { Navigate } from 'react-router-dom';
import EmailVerificationView from '@/components/auth/signup/EmailVerificationView';

const VerifyEmailPage = () => {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If email is already verified, redirect to streamlined profile setup
  if (user.email_confirmed_at) {
    return <Navigate to="/profile-setup" replace />;
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <EmailVerificationView userEmail={user.email} />
      </div>
    </MainLayout>
  );
};

export default VerifyEmailPage;