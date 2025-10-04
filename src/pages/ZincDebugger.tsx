
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import ZincOrderDebugger from '@/components/admin/ZincOrderDebugger';
import { Skeleton } from "@/components/ui/skeleton";
import RetryOrderButton from '@/components/admin/RetryOrderButton';
import SyncZincOrdersButton from '@/components/admin/SyncZincOrdersButton';

const ZincDebugger = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  // Handle authentication with proper loading states
  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
      
      if (!user) {
        console.log("ZincDebugger: No user found, redirecting to auth");
        navigate('/auth', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading state while auth is being checked
  if (isLoading || !authChecked) {
    return (
      <AdminLayout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  // If no user after auth check, show auth required message
  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access the Zinc debugger.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Zinc Order Debugger</h1>
          <p className="text-muted-foreground">
            Troubleshoot and debug Zinc order processing issues
          </p>
          
          <div className="mt-4 flex gap-4">
            <SyncZincOrdersButton />
            <RetryOrderButton 
              orderId="0260ac01-88cc-4451-a760-f4447dcc95cd"
              className="w-auto"
            />
          </div>
        </div>
        
        <ZincOrderDebugger />
      </div>
    </AdminLayout>
  );
};

export default ZincDebugger;
