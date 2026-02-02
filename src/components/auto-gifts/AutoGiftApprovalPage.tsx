import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Check, X, Clock, AlertCircle, User, CalendarDays, DollarSign } from "lucide-react";

interface ApprovalData {
  token: any;
  execution: any;
  products: any[];
  rule: any;
  isExpired: boolean;
  isAlreadyProcessed: boolean;
}

// Helper functions for formatting display
const formatOccasion = (occasion: string): string => {
  if (!occasion) return 'Special Occasion';
  const occasionMap: Record<string, string> = {
    'birthday': 'Birthday',
    'christmas': 'Christmas',
    'mothers_day': "Mother's Day",
    'fathers_day': "Father's Day",
    'valentine': "Valentine's Day",
    'valentines_day': "Valentine's Day",
    'anniversary': 'Anniversary',
    'graduation': 'Graduation',
    'wedding': 'Wedding',
    'housewarming': 'Housewarming',
  };
  return occasionMap[occasion.toLowerCase()] || 
    occasion.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const getRecipientName = (rule: any, execution: any): string => {
  // Try to get from rule.recipient (joined profile)
  if (rule?.recipient?.first_name || rule?.recipient?.last_name) {
    return `${rule.recipient.first_name || ''} ${rule.recipient.last_name || ''}`.trim();
  }
  // Fallback to pending recipient email name extraction
  if (execution?.pending_recipient_email) {
    const emailName = execution.pending_recipient_email.split('@')[0];
    return emailName.replace(/[._]/g, ' ').split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  return 'Your Recipient';
};

const AutoGiftApprovalPage = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [approvalData, setApprovalData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check for action parameter from email links
  const actionParam = searchParams.get('action');

  // Check authentication status first
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Save current URL to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }
      
      setIsAuthenticated(true);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Only load approval data after authentication confirmed
  useEffect(() => {
    if (token && isAuthenticated) {
      loadApprovalData();
    }
  }, [token, isAuthenticated]);

  // Auto-scroll to rejection section if action=reject in URL
  useEffect(() => {
    if (actionParam === 'reject' && approvalData && !loading) {
      setTimeout(() => {
        document.getElementById('reject-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [actionParam, approvalData, loading]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);

      // Get approval token and execution data
      const { data: tokenData, error } = await supabase
        .from('email_approval_tokens')
        .select(`
          *,
          automated_gift_executions (
            *,
            auto_gifting_rules (*)
          )
        `)
        .eq('token', token)
        .single();

      if (error || !tokenData) {
        toast.error("Invalid approval link");
        navigate('/');
        return;
      }

      const execution = tokenData.automated_gift_executions;
      const rule = execution.auto_gifting_rules;
      const products = Array.isArray(execution.selected_products) ? execution.selected_products : [];

      const isExpired = new Date(tokenData.expires_at) < new Date();
      
      // Allow retry if:
      // - Token rejected → truly processed
      // - Token approved AND order exists → truly processed
      // - Token approved but no order (awaiting_payment or abandoned checkout) → allow retry
      const hasCompletedOrder = !!execution.order_id;
      const isAwaitingPayment = execution.status === 'awaiting_payment';
      const isAlreadyProcessed = !!tokenData.rejected_at || 
        (!!tokenData.approved_at && hasCompletedOrder && !isAwaitingPayment);

      setApprovalData({
        token: tokenData,
        execution,
        rule,
        products,
        isExpired,
        isAlreadyProcessed
      });

      // Pre-select all products by default
      setSelectedProducts(products.map((p: any) => p.product_id));

    } catch (error) {
      console.error('Error loading approval data:', error);
      toast.error("Failed to load approval data");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalData || selectedProducts.length === 0) {
      toast.error("Please select at least one product to approve");
      return;
    }

    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('approve-auto-gift', {
        body: {
          token,
          action: 'approve',
          selectedProductIds: selectedProducts
        }
      });

      if (error) {
        throw error;
      }

      // Check if off-session payment was used (no redirect needed)
      if (data?.paymentMethod === 'off_session') {
        const formattedDate = data.scheduledDate 
          ? new Date(data.scheduledDate).toLocaleDateString('en-US', { 
              month: 'long', day: 'numeric', year: 'numeric' 
            })
          : 'soon';
        
        toast.success(`Approved! Your gift will be sent ${formattedDate}`);
        navigate('/dashboard?tab=orders', { 
          state: { message: `Auto-gift approved! Order #${data.orderNumber} created.` }
        });
        return;
      }

      // Fallback: Redirect to Stripe Checkout
      if (data?.checkoutUrl) {
        toast.success("Redirecting to complete payment...");
        window.location.href = data.checkoutUrl;
        return;
      }

      // If we get here without a checkout URL or off-session success, something went wrong
      toast.error("Could not process payment. Please try again.");

    } catch (error: any) {
      console.error('Error approving auto-gift:', error);
      toast.error(error.message || "Failed to approve auto-gift");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('approve-auto-gift', {
        body: {
          token,
          action: 'reject',
          rejectionReason: rejectionReason || 'User rejected the selection'
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Auto-gift rejected");
      navigate('/dashboard?tab=auto-gifts', { 
        state: { message: 'Auto-gift rejected successfully' }
      });

    } catch (error) {
      console.error('Error rejecting auto-gift:', error);
      toast.error("Failed to reject auto-gift");
    } finally {
      setProcessing(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Show loading while checking auth or loading data
  if (loading || isAuthenticated === null) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p>{isAuthenticated === null ? 'Checking authentication...' : 'Loading approval details...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!approvalData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Invalid Approval Link</h2>
            <p className="text-muted-foreground">This approval link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approvalData.isExpired) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Approval Expired</h2>
            <p className="text-muted-foreground">This approval request has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approvalData.isAlreadyProcessed) {
    const wasApproved = !!approvalData.token.approved_at;
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            {wasApproved ? (
              <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
            ) : (
              <X className="h-12 w-12 mx-auto mb-4 text-red-500" />
            )}
            <h2 className="text-xl font-semibold mb-2">
              {wasApproved ? 'Already Approved' : 'Already Rejected'}
            </h2>
            <p className="text-muted-foreground">
              This auto-gift has already been {wasApproved ? 'approved' : 'rejected'}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = approvalData.products
    .filter(p => selectedProducts.includes(p.product_id))
    .reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Auto-Gift Approval</h1>
          <p className="text-muted-foreground">
            Review and approve your automatically selected gifts
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gift Selection Details</CardTitle>
            <CardDescription className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {getRecipientName(approvalData.rule, approvalData.execution)}'s {formatOccasion(approvalData.rule?.date_type)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>{formatDate(approvalData.execution.execution_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Budget: Up to ${approvalData.rule?.budget_limit || 50}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvalData.products.map((product: any) => (
                <div key={product.product_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Checkbox
                    checked={selectedProducts.includes(product.product_id)}
                    onCheckedChange={() => toggleProduct(product.product_id)}
                  />
                  {/* Support both image and image_url field names */}
                  {(product.image || product.image_url) && (
                    <img
                      src={product.image || product.image_url}
                      alt={product.title || product.name || 'Gift'}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    {/* Support both title and name field names */}
                    <h3 className="font-medium">{product.title || product.name || 'Gift Item'}</h3>
                    {/* Only show category/retailer if available */}
                    {(product.category || product.retailer) && (
                      <p className="text-sm text-muted-foreground">
                        {[product.category, product.retailer].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    {(product.rating || product.stars) && (
                      <div className="flex items-center space-x-1 text-sm">
                        <span>⭐ {product.rating || product.stars}</span>
                        {product.review_count && (
                          <span className="text-muted-foreground">
                            ({product.review_count.toLocaleString()} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">${product.price?.toFixed(2) || '0.00'}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Selected:</span>
              <Badge variant="outline" className="text-lg">
                ${totalAmount.toFixed(2)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Approve Selection</CardTitle>
              <CardDescription>
                Approve the selected gifts and place the order
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={handleApprove}
                disabled={processing || selectedProducts.length === 0}
                className="w-full"
                size="lg"
              >
                <Check className="w-4 h-4 mr-2" />
                {processing ? 'Processing...' : `Approve & Order ($${totalAmount.toFixed(2)})`}
              </Button>
            </CardFooter>
          </Card>

          <Card id="reject-section">
            <CardHeader>
              <CardTitle className="text-red-600">Reject Selection</CardTitle>
              <CardDescription>
                Reject this auto-gift selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Optional: Reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <X className="w-4 h-4 mr-2" />
                {processing ? 'Processing...' : 'Reject'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutoGiftApprovalPage;
