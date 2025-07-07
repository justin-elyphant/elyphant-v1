import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnectionsAdapter } from '@/hooks/useConnectionsAdapter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Users, Gift, Heart, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant: 'gift' | 'wishlist' | 'event';
}

const StreamlinedMessageSystem = () => {
  const navigate = useNavigate();
  const { friends, following, loading } = useConnectionsAdapter();
  const [searchTerm, setSearchTerm] = useState('');

  // Combine and filter connections
  const allConnections = [...friends, ...following].filter(conn => 
    conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickActions: QuickAction[] = [
    {
      id: 'send-gift',
      label: 'Send a Gift',
      icon: Gift,
      action: () => navigate('/marketplace?mode=nicole&open=true'),
      variant: 'gift'
    },
    {
      id: 'share-wishlist',
      label: 'Share Wishlist',
      icon: Heart,
      action: () => navigate('/my-wishlists?action=share'),
      variant: 'wishlist'
    },
    {
      id: 'plan-event',
      label: 'Plan Event',
      icon: Calendar,
      action: () => navigate('/events?action=create'),
      variant: 'event'
    }
  ];

  const getActionStyles = (variant: string) => {
    switch (variant) {
      case 'gift':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'wishlist':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'event':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleStartConversation = (connectionId: string, connectionName: string) => {
    navigate(`/messages/${connectionId}?action=new&name=${encodeURIComponent(connectionName)}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-muted-foreground">
          Connect with friends about gifts and special occasions
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Common gift-related conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 justify-start space-x-3",
                    getActionStyles(action.variant)
                  )}
                  onClick={action.action}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start a Conversation</CardTitle>
          <CardDescription>
            Message your connections about upcoming events or gift ideas
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {allConnections.length > 0 ? (
            <div className="space-y-3">
              {allConnections.slice(0, 10).map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={connection.imageUrl} />
                      <AvatarFallback>
                        {connection.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{connection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {connection.relationship || 'Friend'}
                        {connection.username && ` • @${connection.username}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {connection.type === 'friend' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Friend
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleStartConversation(connection.id, connection.name)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              ))}
              
              {allConnections.length > 10 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/connections')}
                  >
                    View All Connections
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No connections found matching your search' : 'No connections yet'}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/connections')}>
                  <Users className="h-4 w-4 mr-2" />
                  Find Connections
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Conversations Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Conversations</CardTitle>
          <CardDescription>
            Your latest gift-related chats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No recent conversations
            </p>
            <p className="text-sm text-muted-foreground">
              Start chatting with your connections about gifts, wishlists, and special occasions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamlinedMessageSystem;