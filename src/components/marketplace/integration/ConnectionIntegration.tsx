import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Gift, Calendar, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";

interface ConnectionIntegrationProps {
  searchQuery?: string;
  onSelectConnection?: (connectionId: string, name: string) => void;
}

const ConnectionIntegration: React.FC<ConnectionIntegrationProps> = ({
  searchQuery,
  onSelectConnection
}) => {
  const navigate = useNavigate();
  const { connections, loading } = useEnhancedConnections();

  // Filter connections with upcoming events or wishlist activity
  const relevantConnections = React.useMemo(() => {
    return connections
      .filter(conn => conn.status === 'accepted')
      .map(conn => ({
        ...conn,
        hasUpcomingEvents: Math.random() > 0.6, // Mock data - replace with real events
        wishlistActivity: Math.random() > 0.5, // Mock data - replace with real activity
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }))
      .filter(conn => conn.hasUpcomingEvents || conn.wishlistActivity)
      .sort((a, b) => {
        // Prioritize upcoming events
        if (a.hasUpcomingEvents && !b.hasUpcomingEvents) return -1;
        if (!a.hasUpcomingEvents && b.hasUpcomingEvents) return 1;
        return b.lastActive.getTime() - a.lastActive.getTime();
      })
      .slice(0, 4);
  }, [connections]);

  const handleConnectionSelect = (connection: any) => {
    if (onSelectConnection) {
      onSelectConnection(connection.connected_user_id, connection.profile_name);
    } else {
      // Navigate to their profile or wishlist
      navigate(`/profile/${connection.connected_user_id}`);
    }
  };

  const handleViewWishlist = (connection: any) => {
    navigate(`/profile/${connection.connected_user_id}?tab=wishlists`);
  };

  if (loading || relevantConnections.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Gift Ideas from Your Network
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Friends with upcoming events or new wishlist items
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relevantConnections.map((connection) => (
            <div 
              key={connection.id} 
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={connection.profile_image} />
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {connection.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{connection.profile_name || 'Unknown User'}</h4>
                    {connection.hasUpcomingEvents && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        <Calendar className="h-3 w-3 mr-1" />
                        Event Soon
                      </Badge>
                    )}
                    {connection.wishlistActivity && (
                      <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700">
                        <Heart className="h-3 w-3 mr-1" />
                        New Items
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {connection.relationship_type} • Active {Math.floor((Date.now() - connection.lastActive.getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {connection.wishlistActivity && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleViewWishlist(connection)}
                    className="text-xs"
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Wishlist
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleConnectionSelect(connection)}
                  className="text-xs"
                >
                  <Gift className="h-3 w-3 mr-1" />
                  Shop
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {connections.length > relevantConnections.length && (
          <div className="text-center mt-3 pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/connections')}
              className="text-xs"
            >
              View All Friends ({connections.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionIntegration;