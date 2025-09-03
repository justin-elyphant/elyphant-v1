import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

/**
 * Component to handle route consistency between desktop and mobile
 * Redirects legacy routes to maintain consistency
 */
const MobileRouteRedirects: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    
    // Route consistency redirects
    const routeRedirects: Record<string, string> = {
      '/profile': '/settings',
      '/profile/settings': '/settings',
      '/user/profile': '/settings',
      '/settings/profile': '/settings',
      '/user/settings': '/settings',
      '/account': '/settings'
    };

    const targetRoute = routeRedirects[path];
    
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
      toast.info('Redirected to updated page', {
        description: 'We\'ve streamlined our navigation for a better experience'
      });
    }

    // Handle routes with parameters
    if (path.startsWith('/profile/')) {
      const segments = path.split('/');
      if (segments.length === 3) {
        // /profile/[id] -> /settings/[id] or handle appropriately
        const id = segments[2];
        if (id !== 'settings') {
          // This might be a public profile view
          navigate(`/users/${id}`, { replace: true });
        }
      }
    }

  }, [location.pathname, navigate]);

  return null; // This component doesn't render anything
};

export default MobileRouteRedirects;