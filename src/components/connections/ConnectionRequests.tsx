
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";

export interface ConnectionRequest {
  id: string;
  userId: string;
  name: string;
  username: string;
  imageUrl?: string;
  requestDate: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface ConnectionRequestsProps {
  requests: ConnectionRequest[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const ConnectionRequests: React.FC<ConnectionRequestsProps> = ({
  requests,
  onAccept,
  onReject
}) => {
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  const handleAccept = async (request: ConnectionRequest) => {
    try {
      setProcessingIds(prev => [...prev, request.id]);
      await onAccept(request.id);
      toast.success(`Added ${request.name} as a connection`);
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept connection request");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== request.id));
    }
  };
  
  const handleReject = async (request: ConnectionRequest) => {
    try {
      setProcessingIds(prev => [...prev, request.id]);
      await onReject(request.id);
      toast.success(`Declined connection request from ${request.name}`);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to decline connection request");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== request.id));
    }
  };
  
  if (requests.length === 0) {
    return (
      <Card className="shadow-sm border-dashed">
        <CardHeader>
          <CardTitle>Connection Requests</CardTitle>
          <CardDescription>You have no pending connection requests</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 text-muted-foreground">
          <p>When someone wants to connect with you, you'll see their request here</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Connection Requests</CardTitle>
        <CardDescription>Respond to people who want to connect with you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="flex justify-between items-center border-b pb-4 last:border-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.imageUrl} />
                  <AvatarFallback>
                    {request.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-sm text-muted-foreground">{request.username}</p>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(request.requestDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={processingIds.includes(request.id)}
                  onClick={() => handleReject(request)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  disabled={processingIds.includes(request.id)}
                  onClick={() => handleAccept(request)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionRequests;
