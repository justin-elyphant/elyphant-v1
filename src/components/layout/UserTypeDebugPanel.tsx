import React from 'react';
import { useUserContext } from '@/hooks/useUserContext';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UserTypeDebugPanel = () => {
  const { user } = useAuth();
  const { userContext, isLoading, userType, signupSource, isEmployee, isVendor, isShopper } = useUserContext();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">User Context Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Email:</span>
            <span className="text-muted-foreground">{user.email}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">User Type:</span>
            <Badge variant={isEmployee ? "destructive" : isVendor ? "secondary" : "default"}>
              {userType}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Signup Source:</span>
            <Badge variant="outline">{signupSource}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Roles:</span>
            <div className="flex gap-1">
              {isEmployee && <Badge variant="destructive" className="text-xs">Employee</Badge>}
              {isVendor && <Badge variant="secondary" className="text-xs">Vendor</Badge>}
              {isShopper && <Badge variant="default" className="text-xs">Shopper</Badge>}
            </div>
          </div>
          
          {userContext?.signup_metadata && Object.keys(userContext.signup_metadata).length > 0 && (
            <div>
              <span className="font-medium">Signup Metadata:</span>
              <pre className="text-xs text-muted-foreground mt-1 bg-slate-50 p-2 rounded">
                {JSON.stringify(userContext.signup_metadata, null, 2)}
              </pre>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center">
              <span className="text-muted-foreground">Loading context...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTypeDebugPanel;