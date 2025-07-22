
import React from 'react';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import ZincOrderDebugger from '@/components/admin/ZincOrderDebugger';

const ZincDebugger = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access the Zinc debugger.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Zinc Order Debugger</h1>
          <p className="text-muted-foreground">
            Troubleshoot and debug Zinc order processing issues
          </p>
        </div>
        
        <ZincOrderDebugger />
      </div>
    </SidebarLayout>
  );
};

export default ZincDebugger;
