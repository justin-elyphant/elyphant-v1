import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useCart } from '@/contexts/CartContext';
import { 
  emergencyCartCleanup, 
  validateCartSecurity, 
  getCartSecurityDebugInfo,
  forceCartReinitialize 
} from '@/utils/cartSecurityUtils';
import { toast } from 'sonner';

const CartSecurityDiagnostic: React.FC = () => {
  const { user } = useAuth();
  const { cartItems, getItemCount } = useCart();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [securityStatus, setSecurityStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSecurityCheck = async () => {
    setIsLoading(true);
    try {
      const [isSecure, info] = await Promise.all([
        validateCartSecurity(),
        getCartSecurityDebugInfo()
      ]);
      
      setSecurityStatus(isSecure);
      setDebugInfo(info);
      
      if (isSecure) {
        toast.success('Cart security validation passed');
      } else {
        toast.warning('Cart security issues detected and cleaned up');
      }
    } catch (error) {
      console.error('Security check failed:', error);
      toast.error('Security check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyCleanup = () => {
    if (confirm('This will clear ALL cart data and reload the page. Continue?')) {
      emergencyCartCleanup();
    }
  };

  const handleForceReinitialize = () => {
    if (confirm('This will reinitialize the entire cart system. Continue?')) {
      forceCartReinitialize();
    }
  };

  useEffect(() => {
    runSecurityCheck();
  }, [user]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cart Security Diagnostic
        </CardTitle>
        <CardDescription>
          Diagnose and fix cart data isolation issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Current User</h4>
            <p className="text-sm text-muted-foreground">
              {user ? user.email : 'Anonymous'}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Cart Items</h4>
            <p className="text-sm text-muted-foreground">
              {getItemCount()} items
            </p>
          </div>
        </div>

        {/* Security Status */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium">Security Status:</h4>
          {securityStatus === null ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : securityStatus ? (
            <Badge variant="default" className="bg-green-500">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Issues Found
            </Badge>
          )}
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="space-y-2">
            <h4 className="font-medium">Debug Information</h4>
            <div className="text-xs font-mono bg-muted p-3 rounded">
              <div>Current User: {debugInfo.currentUser}</div>
              <div>Expected Cart Key: {debugInfo.expectedCartKey}</div>
              <div>Cart Keys Found: {debugInfo.cartKeys?.join(', ') || 'None'}</div>
              <div>Total Storage Keys: {debugInfo.totalLocalStorageKeys}</div>
              <div>Last Check: {debugInfo.timestamp}</div>
            </div>
          </div>
        )}

        {/* Cart Items Debug */}
        {cartItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Current Cart Contents</h4>
            <div className="space-y-1">
              {cartItems.map((item, index) => (
                <div key={index} className="text-xs bg-muted p-2 rounded">
                  <div className="font-medium">{item.product.title}</div>
                  <div className="text-muted-foreground">
                    Quantity: {item.quantity} | Price: ${item.product.price}
                  </div>
                  {item.recipientAssignment && (
                    <div className="text-blue-600">
                      For: {item.recipientAssignment.connectionName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runSecurityCheck} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recheck Security
          </Button>
          
          <Button 
            onClick={handleEmergencyCleanup}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Emergency Cleanup
          </Button>
          
          <Button 
            onClick={handleForceReinitialize}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Reinitialize
          </Button>
        </div>

        {/* Privacy Notice */}
        <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border border-yellow-200">
          <div className="font-medium text-yellow-800 mb-1">
            🔒 Privacy Protection Active
          </div>
          <div className="text-yellow-700">
            This diagnostic helps ensure your cart data remains private and is not shared with other users. 
            If you see cart items that don't belong to you, use the Emergency Cleanup button immediately.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSecurityDiagnostic;