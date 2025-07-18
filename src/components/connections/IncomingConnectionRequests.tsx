
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { getIncomingConnectionRequests, acceptConnectionRequest, rejectConnectionRequest, ConnectionRequest } from "@/services/search/connectionRequestService";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";

interface IncomingConnectionRequestsProps {
  searchTerm: string;
}

const IncomingConnectionRequests: React.FC<IncomingConnectionRequestsProps> = ({ searchTerm }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const fetchIncomingRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const incomingRequests = await getIncomingConnectionRequests(user.id);
      setRequests(incomingRequests);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingRequests();
  }, [user]);

  // Listen for real-time connection changes
  useRealtimeConnections(fetchIncomingRequests);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    const result = await acceptConnectionRequest(requestId);
    
    if (result.success) {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
    
    setProcessingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    const result = await rejectConnectionRequest(requestId);
    
    if (result.success) {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
    
    setProcessingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  };

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      request.requester_profile?.name?.toLowerCase().includes(term) ||
      request.requester_profile?.username?.toLowerCase().includes(term) ||
      request.requester_profile?.bio?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded" />
                    <div className="w-24 h-3 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-20 h-8 bg-muted rounded" />
                  <div className="w-20 h-8 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No incoming requests</h3>
        <p className="text-muted-foreground">
          {searchTerm ? `No requests match "${searchTerm}"` : "You don't have any pending connection requests"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Incoming Connection Requests</h3>
        <Badge variant="secondary">{filteredRequests.length}</Badge>
      </div>
      
      {filteredRequests.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={request.requester_profile?.profile_image} />
                  <AvatarFallback>
                    {request.requester_profile?.name?.substring(0, 2).toUpperCase() || 'UN'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{request.requester_profile?.name || 'Unknown User'}</h4>
                  <p className="text-sm text-muted-foreground">
                    @{request.requester_profile?.username || 'unknown'}
                  </p>
                  {request.requester_profile?.bio && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.requester_profile.bio}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={processingRequests.has(request.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRejectRequest(request.id)}
                  disabled={processingRequests.has(request.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default IncomingConnectionRequests;
