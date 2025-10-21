import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Sparkles, Check, X } from "lucide-react";

interface PendingConnection {
  id: string;
  user_id: string;
  sender_name?: string;
  sender_username?: string;
  sender_avatar?: string;
  has_pending_gift?: boolean;
  gift_occasion?: string;
  gift_message?: string;
  created_at: string;
}

interface PendingConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const PendingConnectionsModal: React.FC<PendingConnectionsModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [pendingConnections, setPendingConnections] = useState<PendingConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && userId) {
      fetchPendingConnections();
    }
  }, [isOpen, userId]);

  const fetchPendingConnections = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          user_id,
          has_pending_gift,
          gift_occasion,
          gift_message,
          created_at
        `)
        .eq('connected_user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      // Fetch sender profiles
      if (data && data.length > 0) {
        const senderIds = data.map(conn => conn.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, username, profile_image')
          .in('id', senderIds);

        if (profileError) throw profileError;

        // Merge connection data with profile data
        const enrichedConnections = data.map(conn => {
          const profile = profiles?.find(p => p.id === conn.user_id);
          return {
            ...conn,
            sender_name: profile?.name || 'Someone',
            sender_username: profile?.username || '@user',
            sender_avatar: profile?.profile_image || '/placeholder.svg'
          };
        });

        setPendingConnections(enrichedConnections);
      } else {
        setPendingConnections([]);
      }
    } catch (error) {
      console.error('Error fetching pending connections:', error);
      toast.error('Failed to load pending connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;

      // Create reciprocal connection
      const conn = pendingConnections.find(c => c.id === connectionId);
      if (conn) {
        const { error: reciprocalError } = await supabase
          .from('user_connections')
          .insert({
            user_id: userId,
            connected_user_id: conn.user_id,
            status: 'accepted',
            relationship_type: 'friend'
          });

        if (reciprocalError && !reciprocalError.message.includes('duplicate')) {
          throw reciprocalError;
        }
      }

      toast.success('Connection accepted! 🎉');
      setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleDecline = async (connectionId: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Connection declined');
      setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleSkipAll = () => {
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (pendingConnections.length === 0) {
    onClose();
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            You Have Pending Connection Requests
          </DialogTitle>
          <DialogDescription>
            Accept or decline connection requests from people who want to connect with you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {pendingConnections.map((connection) => (
            <Card key={connection.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={connection.sender_avatar} />
                    <AvatarFallback>
                      {connection.sender_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{connection.sender_name}</h4>
                      {connection.has_pending_gift && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          Includes Gift
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {connection.sender_username}
                    </p>
                    
                    {connection.has_pending_gift && connection.gift_message && (
                      <div className="bg-muted/50 rounded-md p-3 mb-3">
                        <p className="text-sm italic">"{connection.gift_message}"</p>
                        {connection.gift_occasion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            For: {connection.gift_occasion}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(connection.id)}
                        disabled={processingIds.has(connection.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(connection.id)}
                        disabled={processingIds.has(connection.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {pendingConnections.length} pending {pendingConnections.length === 1 ? 'request' : 'requests'}
          </p>
          <Button variant="ghost" onClick={handleSkipAll}>
            I'll Review Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingConnectionsModal;
