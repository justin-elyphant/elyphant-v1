
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Send } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { getOutgoingConnectionRequests, ConnectionRequest } from "@/services/search/connectionRequestService";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";

interface OutgoingConnectionRequestsProps {
  searchTerm: string;
}

const OutgoingConnectionRequests: React.FC<OutgoingConnectionRequestsProps> = ({ searchTerm }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutgoingRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const outgoingRequests = await getOutgoingConnectionRequests(user.id);
      setRequests(outgoingRequests);
    } catch (error) {
      console.error('Error fetching outgoing requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutgoingRequests();
  }, [user]);

  // Listen for real-time connection changes
  useRealtimeConnections(fetchOutgoingRequests);

  // Filter requests based on search term
  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      request.recipient_profile?.name?.toLowerCase().includes(term) ||
      request.recipient_profile?.username?.toLowerCase().includes(term) ||
      request.recipient_profile?.bio?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
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
                <div className="w-20 h-8 bg-muted rounded" />
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
        <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No outgoing requests</h3>
        <p className="text-muted-foreground">
          {searchTerm ? `No requests match "${searchTerm}"` : "You haven't sent any connection requests yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sent Connection Requests</h3>
        <Badge variant="secondary">{filteredRequests.length}</Badge>
      </div>
      
      {filteredRequests.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={request.recipient_profile?.profile_image} />
                  <AvatarFallback>
                    {request.recipient_profile?.name?.substring(0, 2).toUpperCase() || 'UN'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{request.recipient_profile?.name || 'Unknown User'}</h4>
                  <p className="text-sm text-muted-foreground">
                    @{request.recipient_profile?.username || 'unknown'}
                  </p>
                  {request.recipient_profile?.bio && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.recipient_profile.bio}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-muted-foreground border-muted">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OutgoingConnectionRequests;
