import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MousePointer, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAutoGiftExecution } from '@/hooks/useAutoGiftExecution';
import { toast } from 'sonner';

interface EmailApprovalPanelProps {
  executionId: string;
  recipientEmail: string;
  recipientName: string;
  giftDetails: {
    occasion: string;
    budget: number;
    selectedProducts: Array<{
      id: string;
      title: string;
      price: number;
      image: string;
      marketplace: string;
    }>;
  };
  deliveryDate?: string;
}

interface ApprovalToken {
  id: string;
  token: string;
  email_sent_at: string | null;
  expires_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  approved_via: string | null;
  rejection_reason: string | null;
  created_at: string;
  email_delivery_logs: Array<{
    id: string;
    delivery_status: string;
    event_data: any;
    created_at: string;
  }>;
}

const EmailApprovalPanel: React.FC<EmailApprovalPanelProps> = ({
  executionId,
  recipientEmail,
  recipientName,
  giftDetails,
  deliveryDate
}) => {
  const { sendEmailApproval, getApprovalTokens } = useAutoGiftExecution();
  const [tokens, setTokens] = useState<ApprovalToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadApprovalTokens = async () => {
    try {
      setLoading(true);
      const tokenData = await getApprovalTokens(executionId);
      setTokens(tokenData);
    } catch (error) {
      console.error('Error loading approval tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovalTokens();
  }, [executionId]);

  const handleSendEmail = async () => {
    try {
      setSending(true);
      await sendEmailApproval(
        executionId,
        recipientEmail,
        recipientName,
        giftDetails,
        deliveryDate
      );
      await loadApprovalTokens(); // Refresh tokens
    } catch (error) {
      // Error already handled in hook
    } finally {
      setSending(false);
    }
  };

  const getDeliveryStatus = (token: ApprovalToken) => {
    if (token.approved_at) return 'approved';
    if (token.rejected_at) return 'rejected';
    
    const logs = token.email_delivery_logs || [];
    if (logs.length === 0) return 'pending';
    
    // Get the latest status
    const latestLog = logs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    return latestLog.delivery_status;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Mail, text: 'Sent' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Delivered' },
      opened: { color: 'bg-purple-100 text-purple-800', icon: Eye, text: 'Opened' },
      clicked: { color: 'bg-indigo-100 text-indigo-800', icon: MousePointer, text: 'Clicked' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const hasActiveToken = tokens.some(token => 
    !token.approved_at && 
    !token.rejected_at && 
    !isExpired(token.expires_at)
  );

  const latestToken = tokens.length > 0 ? tokens[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Approval System
        </CardTitle>
        <CardDescription>
          Send approval emails for one-click gift approval
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Send Email Section */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Send Approval Email</h4>
            <p className="text-sm text-muted-foreground">
              To: {recipientEmail}
            </p>
          </div>
          <Button
            onClick={handleSendEmail}
            disabled={sending || hasActiveToken}
            className="flex items-center gap-2"
          >
            {sending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                {hasActiveToken ? 'Email Sent' : 'Send Email'}
              </>
            )}
          </Button>
        </div>

        {/* Token Status */}
        {tokens.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Approval Status
            </h4>
            
            {tokens.map((token) => {
              const status = getDeliveryStatus(token);
              const expired = isExpired(token.expires_at);
              
              return (
                <div 
                  key={token.id} 
                  className={`p-3 border rounded-lg ${expired ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status)}
                      {expired && (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(token.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {token.email_sent_at && (
                      <p className="text-muted-foreground">
                        Email sent: {new Date(token.email_sent_at).toLocaleString()}
                      </p>
                    )}
                    
                    <p className="text-muted-foreground">
                      Expires: {new Date(token.expires_at).toLocaleString()}
                    </p>
                    
                    {token.approved_at && (
                      <p className="text-green-600">
                        Approved: {new Date(token.approved_at).toLocaleString()}
                        {token.approved_via && ` (via ${token.approved_via})`}
                      </p>
                    )}
                    
                    {token.rejected_at && (
                      <p className="text-red-600">
                        Rejected: {new Date(token.rejected_at).toLocaleString()}
                        {token.rejection_reason && ` - ${token.rejection_reason}`}
                      </p>
                    )}
                    
                    {/* Delivery Log Summary */}
                    {token.email_delivery_logs.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="font-medium text-xs text-muted-foreground mb-1">Activity:</p>
                        <div className="flex flex-wrap gap-1">
                          {token.email_delivery_logs
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 3)
                            .map((log, index) => (
                              <span 
                                key={log.id} 
                                className="text-xs px-2 py-1 bg-gray-100 rounded"
                              >
                                {log.delivery_status}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How Email Approval Works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Email includes gift details and one-click approval buttons</li>
            <li>• Recipient can approve, reject, or review gifts without logging in</li>
            <li>• Tokens expire after 48 hours for security</li>
            <li>• Full audit trail of all approval activities</li>
          </ul>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={loadApprovalTokens}
          disabled={loading}
          className="w-full flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmailApprovalPanel;