import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Component to handle legacy route redirects and provide user feedback
 */
const LegacyRouteHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    
    // Handle legacy profile setup routes
    if (path === '/profile-setup' || path.startsWith('/profile-setup/')) {
      toast.info('Profile setup has been streamlined!', {
        description: 'Redirecting you to our improved flow...'
      });
      
      // Small delay to show the toast
      setTimeout(() => {
        navigate('/signup?intent=complete-profile', { replace: true });
      }, 1500);
      return;
    }

    // Handle legacy signup routes  
    if (path === '/signup-legacy') {
      toast.info('Using updated signup flow');
      navigate('/signup', { replace: true });
      return;
    }

    // Handle old onboarding routes
    if (path === '/nicole-onboarding' && !location.search.includes('preserve=true')) {
      toast.info('Nicole AI is now integrated into the main experience');
      navigate('/marketplace?mode=nicole&open=true', { replace: true });
      return;
    }
  }, [location, navigate]);

  return <>{children}</>;
};

export default LegacyRouteHandler;