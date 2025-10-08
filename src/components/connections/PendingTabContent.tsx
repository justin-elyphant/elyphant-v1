
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Send, Inbox, Gift } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("gifts"); // Start with gifts tab to see Heather

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
    
    // Updated logic: Check for pending_invitation status OR has recipientEmail (gift invitations)
    const isGiftInvitation = conn.status === 'pending_invitation' || (conn.recipientEmail && conn.recipientEmail.trim() !== '');
    const matches = isGiftInvitation;
    
    console.log(`🎯 [PendingTabContent] ${conn.name} - isGiftInvitation: ${isGiftInvitation}, matches: ${matches}`);
    return matches;
  });

  console.log('🔍 [PendingTabContent] Filtered giftBasedPending:', giftBasedPending);
  console.log('🔍 [PendingTabContent] giftBasedPending length:', giftBasedPending.length);

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
                                const { error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
                                  body: {
                                    eventType: 'connection_invitation',
                                    customData: {
                                      recipientEmail: connection.recipientEmail,
                                      recipientName: connection.name,
                                      senderName: 'You',
                                      customMessage: `Hi ${connection.name.split(' ')[0]}! Just following up on my invitation to connect on Elyphant. I'd love to share wishlists and find perfect gifts for each other!`,
                                      invitationUrl: window.location.origin + '/signup'
                                    }
                                  }
                                });
                                
                                if (error) {
                                  toast.error('Failed to resend invitation');
                                } else {
                                  toast.success('Invitation resent successfully!');
                                }
                              } catch (error) {
                                console.error('Error resending invitation:', error);
                                toast.error('Failed to resend invitation');
                              }
                            }}
                            className="text-xs h-6"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Resend
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
    </div>
  );
};

export default PendingTabContent;
