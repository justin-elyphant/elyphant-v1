import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail,
  Calendar,
  DollarSign,
  User,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useAutoGiftExecution } from '@/hooks/useAutoGiftExecution';
import { UnifiedGiftExecution } from '@/services/UnifiedGiftManagementService';
import EmailApprovalPanel from './EmailApprovalPanel';
import EmailPreviewPanel from './EmailPreviewPanel';
import { EnhancedNotificationService } from '@/services/EnhancedNotificationService';
import { toast } from 'sonner';

const AutoGiftApprovalDashboard: React.FC = () => {
  const { 
    executions, 
    loading, 
    processing, 
    loadExecutions, 
    processPendingExecutions, 
    approveExecution 
  } = useAutoGiftExecution();

  const [selectedExecution, setSelectedExecution] = useState<UnifiedGiftExecution | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadExecutions();
  }, []);

  const pendingExecutions = executions.filter(exec => exec.status === 'pending');
  const approvedExecutions = executions.filter(exec => exec.status === 'processing');
  const rejectedExecutions = executions.filter(exec => exec.status === 'failed' || exec.status === 'cancelled');
  const completedExecutions = executions.filter(exec => exec.status === 'completed');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Approval' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Approved' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw, text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Failed' },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleApprove = async (execution: UnifiedGiftExecution) => {
    try {
      const productIds = execution.selected_products?.map((p: any) => p.id) || [];
      await approveExecution(execution.id, productIds);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleReject = async (execution: UnifiedGiftExecution) => {
    // TODO: Implement rejection logic
    toast.info("Rejection functionality coming soon");
  };

  const ExecutionCard: React.FC<{ execution: UnifiedGiftExecution }> = ({ execution }) => {
    const products = execution.selected_products || [];
    
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => setSelectedExecution(execution)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Auto-Gift Execution</CardTitle>
            </div>
            {getStatusBadge(execution.status)}
          </div>
          <CardDescription>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(execution.execution_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(execution.total_amount)}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {products.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Selected Gifts:</h4>
              <div className="grid grid-cols-1 gap-2">
                {products.slice(0, 2).map((product: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-sm text-green-600">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                ))}
                {products.length > 2 && (
                  <p className="text-sm text-muted-foreground">
                    +{products.length - 2} more gifts
                  </p>
                )}
              </div>
            </div>
          )}
          
          {execution.error_message && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {execution.error_message}
            </div>
          )}
          
          {execution.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(execution);
                }}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(execution);
                }}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ExecutionDetail: React.FC<{ execution: UnifiedGiftExecution }> = ({ execution }) => {
    // Mock recipient data - in real app, this would come from the execution/rule data
    const mockRecipient = {
      email: "sarah@example.com",
      name: "Sarah Johnson"
    };
    
    const mockGiftDetails = {
      occasion: "Birthday",
      budget: execution.total_amount,
      selectedProducts: execution.selected_products || []
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Execution Details</h2>
            <p className="text-muted-foreground">
              ID: {execution.id}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedExecution(null)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Execution Info */}
          <Card>
            <CardHeader>
              <CardTitle>Execution Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(execution.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Execution Date:</span>
                <span>{new Date(execution.execution_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">{formatCurrency(execution.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(execution.created_at).toLocaleString()}</span>
              </div>
              {execution.updated_at !== execution.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(execution.updated_at).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Approval Panel */}
          {execution.status === 'pending' && (
            <EmailApprovalPanel
              executionId={execution.id}
              recipientEmail={mockRecipient.email}
              recipientName={mockRecipient.name}
              giftDetails={mockGiftDetails}
              deliveryDate={execution.execution_date.toISOString()}
            />
          )}
        </div>

        {/* Products Details */}
        {execution.selected_products && execution.selected_products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {execution.selected_products.map((product: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    <h4 className="font-medium mb-2">{product.title}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(product.price)}
                      </span>
                      <Badge variant="outline">{product.marketplace}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (selectedExecution) {
    return <ExecutionDetail execution={selectedExecution} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auto-Gift Approvals</h1>
          <p className="text-muted-foreground">
            Manage and approve automated gift executions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadExecutions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={processPendingExecutions}
            disabled={processing}
          >
            <Gift className="h-4 w-4 mr-2" />
            Process Pending
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Completed ({completedExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedExecutions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading executions...</p>
            </div>
          ) : pendingExecutions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedExecutions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No approved executions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedExecutions.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No completed executions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedExecutions.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No rejected executions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoGiftApprovalDashboard;