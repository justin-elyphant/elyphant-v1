
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, AlertCircle, Info, Shield } from 'lucide-react';
import UnifiedCheckoutForm from '@/components/checkout/UnifiedCheckoutForm';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cartItems, deliveryGroups, getUnassignedItems } = useCart();
  const { profile } = useProfile();
  
  // Check if user cancelled payment
  const cancelled = searchParams.get('cancelled') === 'true';

  // Note: Cart session tracking is handled by UnifiedCheckoutForm to avoid race conditions
  // Cart abandonment tracking occurs in Cart page via useCartSessionTracking hook

  // Check cart completeness and redirect accordingly
  if (cartItems.length === 0) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some items to your cart before checking out
            </p>
            <Button onClick={() => navigate("/marketplace")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Helper to check if address is complete (supports both legacy and DB key formats)
  const isCompleteAddress = (addr: any, name?: string): boolean => {
    if (!addr) return false;
    
    const line1 = addr.address_line1 || addr.address || addr.line1;
    const zip = addr.zip_code || addr.zipCode || addr.postal_code;
    const city = addr.city;
    const state = addr.state || addr.region;
    const addressName = addr.name || name;
    
    return !!(line1 && zip && city && state && addressName);
  };

  // Helper to get missing fields
  const getMissingFields = (addr: any, name?: string) => {
    const missing = [];
    if (!addr) return ['All address fields'];
    
    if (!(addr.name || name)) missing.push('Name');
    if (!(addr.address_line1 || addr.address || addr.line1)) missing.push('Street Address');
    if (!addr.city) missing.push('City');
    if (!(addr.state || addr.region)) missing.push('State');
    if (!(addr.zip_code || addr.zipCode || addr.postal_code)) missing.push('ZIP Code');
    return missing;
  };

  // Comprehensive validation for all order types
  const validateCheckoutReadiness = () => {
    const issues = [];
    const unassignedItems = getUnassignedItems();
    const hasUnassignedItems = unassignedItems.length > 0;
    
    // Check unassigned items (self-delivery)
    if (hasUnassignedItems) {
      const shippingAddress = profile?.shipping_address;
      const userName = profile?.name;
      
      if (!isCompleteAddress(shippingAddress, userName)) {
        issues.push({
          type: 'self',
          message: 'Your shipping address is incomplete',
          count: unassignedItems.length,
          missingFields: getMissingFields(shippingAddress, userName)
        });
      }
    }
    
    // Check ALL delivery groups (recipients)
    const incompleteRecipients = deliveryGroups.filter(group => {
      const addr = group.shippingAddress;
      return !isCompleteAddress(addr, group.connectionName);
    });
    
    if (incompleteRecipients.length > 0) {
      incompleteRecipients.forEach(group => {
        issues.push({
          type: 'recipient',
          recipientName: group.connectionName,
          message: `${group.connectionName}'s shipping address is incomplete`,
          missingFields: getMissingFields(group.shippingAddress, group.connectionName)
        });
      });
    }
    
    return issues;
  };

  const validationIssues = validateCheckoutReadiness();

  // Block checkout if any addresses are incomplete
  if (validationIssues.length > 0) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Complete Shipping Information Required
            </h2>
            <p className="text-muted-foreground mb-6">
              {validationIssues.length} address{validationIssues.length > 1 ? 'es' : ''} 
              {validationIssues.length > 1 ? ' need' : ' needs'} to be completed before checkout
            </p>
            
            {/* List all issues */}
            <div className="text-left max-w-md mx-auto mb-6 space-y-2">
              {validationIssues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-md">
                  <p className="font-medium text-sm">{issue.message}</p>
                  {issue.missingFields && issue.missingFields.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Missing: {issue.missingFields.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <Button onClick={() => navigate("/cart")} className="w-full sm:w-auto">
                Complete Addresses in Cart
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/marketplace")}
                className="w-full sm:w-auto"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cancelled Payment Banner */}
        {cancelled && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Cancelled</AlertTitle>
            <AlertDescription>
              Your cart is still saved. Ready to complete your purchase?
              <Button 
                variant="link" 
                className="ml-2 p-0 h-auto"
                onClick={() => setSearchParams({})}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
      <UnifiedCheckoutForm />
    </SidebarLayout>
  );
};

export default Checkout;
