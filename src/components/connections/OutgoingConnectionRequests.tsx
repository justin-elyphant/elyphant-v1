
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Send, MessageSquare, RefreshCw, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth";
import { getOutgoingConnectionRequests, ConnectionRequest, cancelConnectionRequest } from "@/services/search/connectionRequestService";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";
import { toast } from "sonner";
import NudgeModal from "@/components/gifting/NudgeModal";

interface OutgoingConnectionRequestsProps {
  searchTerm: string;
}

const OutgoingConnectionRequests: React.FC<OutgoingConnectionRequestsProps> = ({ searchTerm }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ConnectionRequest | null>(null);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);
  const [confirmDeleteConnectionId, setConfirmDeleteConnectionId] = useState<string | null>(null);

  const fetchOutgoingRequests = async () => {
    console.log('🔍 [OutgoingConnectionRequests] Starting fetch for user:', user?.id);
    
    if (!user) {
      console.log('❌ [OutgoingConnectionRequests] No authenticated user found');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('📡 [OutgoingConnectionRequests] Calling getOutgoingConnectionRequests with userId:', user.id);
      const outgoingRequests = await getOutgoingConnectionRequests(user.id);
      console.log('✅ [OutgoingConnectionRequests] Received requests:', outgoingRequests.length, outgoingRequests);
      setRequests(outgoingRequests);
    } catch (error) {
      console.error('❌ [OutgoingConnectionRequests] Error fetching outgoing requests:', error);
      toast.error('Failed to load outgoing connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    console.log('🔄 [OutgoingConnectionRequests] Manual refresh triggered');
    setRefreshing(true);
    await fetchOutgoingRequests();
    setRefreshing(false);
    toast.success('Connection requests refreshed');
  };

  const handleSendNudge = (request: ConnectionRequest) => {
    console.log('💌 [OutgoingConnectionRequests] Opening nudge modal for request:', request.id);
    setSelectedRequest(request);
    setShowNudgeModal(true);
  };

  const handleNudgeComplete = () => {
    setShowNudgeModal(false);
    setSelectedRequest(null);
    toast.success('Reminder sent successfully!');
  };

  const handleConfirmCancel = async () => {
    if (!confirmDeleteConnectionId) return;

    setDeletingConnectionId(confirmDeleteConnectionId);
    const result = await cancelConnectionRequest(confirmDeleteConnectionId);
    
    if (result.success) {
      // Refresh the list
      await fetchOutgoingRequests();
    }
    
    setDeletingConnectionId(null);
    setConfirmDeleteConnectionId(null);
  };

  useEffect(() => {
    console.log('🚀 [OutgoingConnectionRequests] Component mounted, user:', user?.id);
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

  console.log('🔍 [OutgoingConnectionRequests] Filtered requests:', filteredRequests.length, 'Search term:', searchTerm);

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
        <p className="text-muted-foreground mb-4">
          {searchTerm ? `No requests match "${searchTerm}"` : "You haven't sent any connection requests yet"}
        </p>
        <Button onClick={handleManualRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sent Connection Requests</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredRequests.length}</Badge>
            <Button onClick={handleManualRefresh} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
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
                  <Button
                    onClick={() => handleSendNudge(request)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Send Reminder
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setConfirmDeleteConnectionId(request.id)}
                    disabled={deletingConnectionId === request.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
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

      {/* Nudge Modal for Connection Requests */}
      {selectedRequest && (
        <NudgeModal
          isOpen={showNudgeModal}
          onClose={() => {
            setShowNudgeModal(false);
            setSelectedRequest(null);
          }}
          recipientEmail={selectedRequest.recipient_profile?.username + '@example.com'} // Placeholder email
          recipientName={selectedRequest.recipient_profile?.name || 'Unknown User'}
          onComplete={handleNudgeComplete}
          connectionType="connection_request"
          connectionId={selectedRequest.id}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmDeleteConnectionId} onOpenChange={(open) => !open && setConfirmDeleteConnectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Connection Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this connection request to{' '}
              {filteredRequests.find(r => r.id === confirmDeleteConnectionId)?.recipient_profile?.name}? 
              They won't be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OutgoingConnectionRequests;
