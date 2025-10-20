import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useUserContext } from '@/hooks/useUserContext';
import { supabase } from '@/integrations/supabase/client';

interface VendorGuardProps {
  children: React.ReactNode;
}

type AccessStatus = 'checking' | 'allowed' | 'denied' | 'unapproved-vendor' | 'not-vendor';

export const VendorGuard: React.FC<VendorGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { userContext, isLoading: contextLoading, isVendor } = useUserContext();
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');

  useEffect(() => {
    const checkVendorAccess = async () => {
      if (!user) {
        console.log('VendorGuard: No user, redirecting to vendor portal login');
        navigate('/vendor-portal');
        return;
      }

      // First check user type from context
      if (userContext && !isVendor) {
        console.log('VendorGuard: User is not a vendor based on user type');
        setAccessStatus('not-vendor');
        return;
      }

      try {
        console.log('VendorGuard: Checking vendor access for user:', user.email);
        
        // Check vendor role using secure has_role function
        const { data: hasVendorRole, error } = await supabase
          .rpc('has_role', { 
            _user_id: user.id, 
            _role: 'vendor' 
          });

        if (error) {
          console.error('VendorGuard: Error checking vendor role:', error);
          setAccessStatus('denied');
          return;
        }

        if (hasVendorRole) {
          console.log('VendorGuard: Access approved for vendor');
          setAccessStatus('allowed');
        } else {
          // Check if user has a vendor account but not approved yet
          const { data: vendorAccount, error: vendorError } = await supabase
            .from('vendor_accounts')
            .select('approval_status')
            .eq('user_id', user.id)
            .single();

          if (vendorError && vendorError.code !== 'PGRST116') {
            console.error('VendorGuard: Error checking vendor account:', vendorError);
            setAccessStatus('denied');
            return;
          }

          if (vendorAccount) {
            console.log('VendorGuard: Vendor account exists but not approved, status:', vendorAccount.approval_status);
            setAccessStatus('unapproved-vendor');
          } else {
            console.log('VendorGuard: User is not a vendor');
            setAccessStatus('not-vendor');
          }
        }
      } catch (err) {
        console.error('VendorGuard: Unexpected error:', err);
        setAccessStatus('denied');
      }
    };

    if (!isLoading && !contextLoading) {
      checkVendorAccess();
    }
  }, [user, isLoading, contextLoading, userContext, isVendor, navigate]);

  // Show loading while checking access
  if (isLoading || contextLoading || accessStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying vendor access...</p>
        </div>
      </div>
    );
  }

  // Render access denied screens
  if (accessStatus === 'not-vendor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Vendor Access Required</h2>
            <p className="text-slate-600 mb-6">
              You need to be an approved vendor to access this portal.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/vendor-partner')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Become a Vendor
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors"
              >
                Back to Elyphant
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accessStatus === 'unapproved-vendor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Application Under Review</h2>
            <p className="text-slate-600 mb-6">
              Your vendor application is being reviewed. You'll receive an email notification once approved.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Elyphant
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accessStatus === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">
              You don't have permission to access the vendor portal.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/vendor-partner')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Learn About Becoming a Vendor
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 transition-colors"
              >
                Back to Elyphant
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render children if access is allowed
  return <>{children}</>;
};