import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle, X, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface AddressRequest {
  id: string;
  requester_name: string;
  message: string;
  created_at: string;
  expires_at: string;
}

interface AddressRequestNotificationsProps {
  receivedRequests: AddressRequest[];
}

const AddressRequestNotifications: React.FC<AddressRequestNotificationsProps> = ({
  receivedRequests
}) => {
  const [dismissedRequests, setDismissedRequests] = useState<string[]>([]);

  const activeRequests = receivedRequests.filter(
    req => !dismissedRequests.includes(req.id)
  );

  const handleDismiss = (requestId: string) => {
    setDismissedRequests(prev => [...prev, requestId]);
  };

  const handleFulfill = (requestId: string) => {
    // This would typically update the request status in the database
    toast.success('Address shared successfully');
    handleDismiss(requestId);
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (activeRequests.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {activeRequests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeRequests.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Address Requests</h4>
            <Badge variant="secondary">{activeRequests.length} pending</Badge>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activeRequests.map(request => (
              <Card key={request.id} className="relative">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{request.requester_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(request.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {request.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Expires in {getDaysUntilExpiry(request.expires_at)} days
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleFulfill(request.id)}
                      className="h-7 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Share Address
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All Requests
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddressRequestNotifications;