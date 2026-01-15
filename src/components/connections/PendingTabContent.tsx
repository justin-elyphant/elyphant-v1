
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Clock, Send, Inbox, Gift, XCircle } from "lucide-react";
import { Connection } from "@/types/connections";
import IncomingConnectionRequests from "./IncomingConnectionRequests";
import OutgoingConnectionRequests from "./OutgoingConnectionRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingTabContentProps {
  pendingConnections: Connection[];
  searchTerm: string;
  onRefresh: () => void;
}

const PendingTabContent: React.FC<PendingTabContentProps> = ({ 
  pendingConnections, 
  searchTerm, 
  onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState("gifts");
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);
  const [confirmDeleteConnectionId, setConfirmDeleteConnectionId] = useState<string | null>(null);

  console.log('🔍 [PendingTabContent] Received pendingConnections:', pendingConnections);
  console.log('🔍 [PendingTabContent] pendingConnections length:', pendingConnections.length);

  // Filter gift-based pending connections (including pending_invitation status)
  const giftBasedPending = pendingConnections.filter(conn => {
    console.log(`🎯 [PendingTabContent] DETAILED CHECK for ${conn.name}:`, {
      isPending: conn.isPending,
      recipientEmail: conn.recipientEmail,
      status: conn.status,
      type: conn.type,
      isIncoming: conn.isIncoming,
      connectionId: conn.connectionId,
      id: conn.id
    });
    
    // Only include active gift invitations
    const isGiftInvitation = conn.status === 'pending_invitation';
    const matches = isGiftInvitation;
    
    console.log(`🎯 [PendingTabContent] ${conn.name} - isGiftInvitation: ${isGiftInvitation}, matches: ${matches}`);
    return matches;
  });

  console.log('🔍 [PendingTabContent] Filtered giftBasedPending:', giftBasedPending);
  console.log('🔍 [PendingTabContent] giftBasedPending length:', giftBasedPending.length);

  const handleCancelInvitation = async (connectionId: string, recipientName: string) => {
    setDeletingConnectionId(connectionId);
    
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', connectionId);
      
      if (error) throw error;
      
      toast.success(`Invitation to ${recipientName} cancelled`);
      onRefresh();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error("Couldn't cancel this invitation. Please try again.");
    } finally {
      setDeletingConnectionId(null);
      setConfirmDeleteConnectionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pending Connections</h2>
          <p className="text-muted-foreground">
            Manage your connection requests and gift invitations
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Incoming
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="gifts" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Gift Invitations
            {giftBasedPending.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {giftBasedPending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6">
          <IncomingConnectionRequests searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6">
          <OutgoingConnectionRequests searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="gifts" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gift-Based Invitations</h3>
              <Badge variant="secondary">{giftBasedPending.length}</Badge>
            </div>
            
            {giftBasedPending.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gift invitations</h3>
                <p className="text-gray-500">
                  {searchTerm ? `No invitations match "${searchTerm}"` : "You don't have any pending gift invitations"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {giftBasedPending.map((connection) => (
                  <Card key={connection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={connection.imageUrl} />
                            <AvatarFallback>
                              {connection.name?.substring(0, 2).toUpperCase() || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{connection.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {connection.username}
                            </p>
                            {connection.recipientEmail && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Invited: {connection.recipientEmail}
                              </p>
                            )}
                            {connection.bio && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {connection.bio}
                              </p>
                            )}
                            {connection.connectionDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Sent {new Date(connection.connectionDate).toLocaleDateString()}
                                {(connection as any).invitation_reminder_count > 0 && (
                                  <span className="ml-1 text-amber-600">
                                    ({(connection as any).invitation_reminder_count} reminder{(connection as any).invitation_reminder_count > 1 ? 's' : ''} sent)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            <Gift className="h-3 w-3 mr-1" />
                            Gift Invitation
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                // Fetch connection data including invitation token
                                const { data: conn, error: connError } = await supabase
                                  .from('user_connections')
                                  .select('id, user_id, invitation_token, pending_recipient_email, pending_recipient_name')
                                  .eq('id', connection.connectionId || connection.id)
                                  .single();
                                
                                if (connError || !conn?.invitation_token) {
                                  console.error('❌ Could not find invitation token:', connError);
                                  toast.error('Could not find invitation token');
                                  return;
                                }

                                // Build production invite URL
                                const inviteUrl = `https://elyphant.ai/auth?invite=${conn.invitation_token}`;
                                console.log('✅ [Resend] Built invite URL:', inviteUrl);

                                // Fetch sender name
                                const { data: sender } = await supabase
                                  .from('profiles')
                                  .select('first_name, name')
                                  .eq('id', conn.user_id)
                                  .single();
                                const senderName = sender?.first_name || sender?.name || 'Someone';

                                console.log('📧 [Resend] Invoking orchestrator with:', {
                                  recipient_email: conn.pending_recipient_email,
                                  recipient_name: conn.pending_recipient_name,
                                  sender_name: senderName,
                                  invitation_url: inviteUrl,
                                  connection_id: conn.id
                                });

                                // Invoke orchestrator with standardized payload
                                const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
                                  body: {
                                    eventType: 'connection_invitation',
                                    data: {
                                      sender_name: senderName,
                                      recipient_email: conn.pending_recipient_email,
                                      recipient_name: conn.pending_recipient_name,
                                      connection_id: conn.id,
                                      invitation_url: inviteUrl
                                    }
                                  }
                                });
                                
                                if (error) {
                                  console.error('❌ [Resend] Orchestrator error:', error);
                                  toast.error('Failed to resend invitation');
                                } else {
                                  console.log('✅ [Resend] Invitation resent successfully');
                                  toast.success('Invitation resent successfully!');
                                }
                              } catch (error) {
                                console.error('❌ [Resend] Error resending invitation:', error);
                                toast.error('Failed to resend invitation');
                              }
                            }}
                            className="text-xs h-6"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setConfirmDeleteConnectionId(connection.connectionId || connection.id)}
                            disabled={deletingConnectionId === (connection.connectionId || connection.id)}
                            className="text-xs h-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmDeleteConnectionId} onOpenChange={(open) => !open && setConfirmDeleteConnectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this invitation to{' '}
              {giftBasedPending.find(c => (c.connectionId || c.id) === confirmDeleteConnectionId)?.name}? 
              They won't be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const connection = giftBasedPending.find(c => (c.connectionId || c.id) === confirmDeleteConnectionId);
                if (connection) {
                  handleCancelInvitation(connection.connectionId || connection.id, connection.name);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingTabContent;
