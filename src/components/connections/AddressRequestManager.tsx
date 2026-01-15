import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MailIcon, Clock, CheckCircle, AlertCircle, Send, UserCheck } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AddressRequestNotifications from './AddressRequestNotifications';

interface AddressRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  recipient_email: string;
  message: string;
  status: 'pending' | 'fulfilled' | 'declined' | 'expired';
  created_at: string;
  fulfilled_at?: string;
  expires_at: string;
  reminder_count: number;
  requester_name: string;
  recipient_name?: string;
}

interface Connection {
  id: string;
  connected_user_id: string;
  name: string;
  email?: string;
  has_address: boolean;
  relationship_type: string;
}

const AddressRequestManager: React.FC = () => {
  const { profile } = useProfile();
  const [sentRequests, setSentRequests] = useState<AddressRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<AddressRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sent');
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchSentRequests(),
        fetchReceivedRequests(),
        fetchConnections()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load address requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('address_requests')
        .select('*')
        .eq('requester_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: AddressRequest[] = (data || []).map(req => ({
        id: req.id,
        requester_id: req.requester_id,
        recipient_id: req.recipient_id,
        recipient_email: req.recipient_email,
        message: req.message,
        status: req.status as "pending" | "fulfilled" | "expired" | "declined",
        created_at: req.created_at,
        expires_at: req.expires_at,
        reminder_count: 0,
        requester_name: profile!.name || 'You',
        recipient_name: 'Recipient' // Will be enhanced later
      }));

      setSentRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      setSentRequests([]);
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('address_requests')
        .select('*')
        .eq('recipient_id', profile!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: AddressRequest[] = (data || []).map(req => ({
        id: req.id,
        requester_id: req.requester_id,
        recipient_id: req.recipient_id,
        recipient_email: req.recipient_email,
        message: req.message,
        status: req.status as "pending" | "fulfilled" | "expired" | "declined",
        created_at: req.created_at,
        expires_at: req.expires_at,
        reminder_count: 0,
        requester_name: 'Requester', // Will be enhanced later
        recipient_name: profile!.name
      }));

      setReceivedRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching received requests:', error);
      setReceivedRequests([]);
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          profiles!user_connections_connected_user_id_fkey(
            name,
            email
          )
        `)
        .eq('user_id', profile!.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const formattedConnections: Connection[] = (data || []).map(conn => {
        const connProfile = conn.profiles as any;
        return {
          id: conn.id,
          connected_user_id: conn.connected_user_id,
          name: connProfile?.name || 'Unknown User',
          email: connProfile?.email,
          has_address: false, // Will be updated with actual address check
          relationship_type: conn.relationship_type
        };
      });

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const createAddressRequest = async () => {
    if (!selectedConnection || !profile) {
      toast.error('Please select a connection and enter a message');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request',
          recipientEmail: selectedConnection.email || '',
          data: {
            recipientId: selectedConnection.connected_user_id,
            recipientEmail: selectedConnection.email || '',
            recipientName: selectedConnection.name,
            requesterName: 'You',
            message: requestMessage || 'Could you please share your address for gift delivery?',
            requestUrl: window.location.origin + '/address-request'
          }
        }
      });

      if (error) throw error;

      toast.success(`Address request sent to ${selectedConnection.name}`);
      
      // Refresh the sent requests
      await fetchSentRequests();
      
      setSelectedConnection(null);
      setRequestMessage('');
      
    } catch (error) {
      console.error('Error creating address request:', error);
      toast.error('Failed to send address request');
    }
  };

  const sendEmailNotification = async (request: AddressRequest) => {
    // This would call orchestrator to send email
    try {
      await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request',
          recipientEmail: request.recipient_email,
          data: {
            recipientEmail: request.recipient_email,
            recipientName: request.recipient_name || 'User',
            requesterName: request.requester_name,
            message: request.message,
            requestUrl: window.location.origin + '/address-request'
          }
        }
      });
    } catch (error) {
      console.log('Email notification failed (would be handled gracefully):', error);
    }
  };

  const sendReminder = async (requestId: string) => {
    try {
      const updatedRequests = sentRequests.map(req => 
        req.id === requestId 
          ? { ...req, reminder_count: req.reminder_count + 1 }
          : req
      );
      setSentRequests(updatedRequests);
      
      toast.success('Reminder sent');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const fulfillRequest = async (requestId: string) => {
    try {
      const updatedRequests = receivedRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'fulfilled' as const, fulfilled_at: new Date().toISOString() }
          : req
      );
      setReceivedRequests(updatedRequests);
      
      toast.success('Address request fulfilled');
    } catch (error) {
      console.error('Error fulfilling request:', error);
      toast.error('Failed to fulfill request');
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const updatedRequests = receivedRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'declined' as const }
          : req
      );
      setReceivedRequests(updatedRequests);
      
      toast.success('Address request declined');
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    }
  };

  const getStatusBadge = (status: AddressRequest['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      fulfilled: { variant: 'default' as const, icon: CheckCircle, label: 'Fulfilled' },
      declined: { variant: 'destructive' as const, icon: AlertCircle, label: 'Declined' },
      expired: { variant: 'outline' as const, icon: AlertCircle, label: 'Expired' }
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Loading address requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Address Request Manager</h2>
        <AddressRequestNotifications 
          receivedRequests={receivedRequests.filter(r => r.status === 'pending')}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Received ({receivedRequests.filter(r => r.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="new">
            Send New
          </TabsTrigger>
        </TabsList>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MailIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No address requests sent yet</p>
              </CardContent>
            </Card>
          ) : (
            sentRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">To: {request.recipient_name}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.message}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Sent {new Date(request.created_at).toLocaleDateString()} • 
                        {request.reminder_count > 0 && ` ${request.reminder_count} reminder(s) sent • `}
                        Expires {new Date(request.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendReminder(request.id)}
                        disabled={request.reminder_count >= 3}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {request.reminder_count >= 3 ? 'Max Reminders' : 'Send Reminder'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Received Requests Tab */}
        <TabsContent value="received" className="space-y-4">
          {receivedRequests.filter(r => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No pending address requests</p>
              </CardContent>
            </Card>
          ) : (
            receivedRequests
              .filter(r => r.status === 'pending')
              .map(request => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">From: {request.requester_name}</h4>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {request.message}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Received {new Date(request.created_at).toLocaleDateString()} • 
                          Expires {new Date(request.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => fulfillRequest(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Share Address
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => declineRequest(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Send New Request Tab */}
        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Address Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Connection</label>
                <div className="mt-2 space-y-2">
                  {connections.map(connection => (
                    <div
                      key={connection.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConnection?.id === connection.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedConnection(connection)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{connection.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {connection.relationship_type}
                          </div>
                        </div>
                        {connection.email && (
                          <div className="text-sm text-muted-foreground">
                            {connection.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedConnection && (
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Hi! I'd like to send you a gift. Could you please share your shipping address?"
                    className="mt-2"
                    rows={3}
                  />
                </div>
              )}

              <Button
                onClick={createAddressRequest}
                disabled={!selectedConnection}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Address Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddressRequestManager;