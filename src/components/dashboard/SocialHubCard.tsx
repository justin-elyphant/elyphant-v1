import React from "react";
import { Link } from "react-router-dom";
import { Users, MessageSquare, UserPlus, Send, Clock, TrendingUp, Heart, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { Skeleton } from "@/components/ui/skeleton";
import InviteFriendCTA from "@/components/social/InviteFriendCTA";

const SocialHubCard = () => {
  const { 
    connections, 
    pendingRequests, 
    followers, 
    following, 
    loading,
    acceptConnectionRequest,
    rejectConnectionRequest 
  } = useEnhancedConnections();

  // Connection metrics
  const metrics = React.useMemo(() => {
    const totalConnections = connections.length;
    const pendingCount = pendingRequests.length;
    const followersCount = followers.length;
    const followingCount = following.length;
    
    // Mock growth data - replace with real analytics
    const weeklyGrowth = Math.floor(Math.random() * 5) + 1;
    
    return {
      totalConnections,
      pendingCount,
      followersCount,
      followingCount,
      weeklyGrowth
    };
  }, [connections, pendingRequests, followers, following]);

  // Recent activity (mock data - replace with real data)
  const recentActivity = React.useMemo(() => [
    {
      id: '1',
      type: 'new_connection',
      user: 'Sarah Johnson',
      avatar: null,
      time: '2h ago',
      action: 'connected with you'
    },
    {
      id: '2',
      type: 'wishlist_update',
      user: 'Mike Chen',
      avatar: null,
      time: '1d ago',
      action: 'updated their wishlist'
    }
  ], []);

  // Connection suggestions (first 2 from existing suggestions)
  const quickSuggestions = React.useMemo(() => 
    connections.slice(0, 2).map(conn => ({
      id: conn.id,
      name: conn.profile_name || 'Unknown User',
      username: conn.profile_username || '@unknown',
      avatar: conn.profile_image,
      mutualFriends: Math.floor(Math.random() * 5) + 1
    })), [connections]
  );

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Social Hub
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Your connections and conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Social Hub
              {metrics.pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {metrics.pendingCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Connection center & activity
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/connections" className="flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              <span className="text-xs">Manage</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Friend CTA */}
        <InviteFriendCTA />

        {/* Connection Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-center p-3 sm:p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold text-primary">{metrics.totalConnections}</div>
            <div className="text-xs text-muted-foreground">Friends</div>
          </div>
          <div className="text-center p-3 sm:p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold text-blue-600">{metrics.followersCount}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center p-3 sm:p-2 rounded-lg bg-muted/50 relative">
            <div className="text-xl font-bold text-green-600 flex items-center justify-center gap-1">
              +{metrics.weeklyGrowth}
              <TrendingUp className="h-3 w-3" />
            </div>
            <div className="text-xs text-muted-foreground">This week</div>
          </div>
        </div>

        {/* Pending Requests */}
        {metrics.pendingCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                Pending Requests
              </h4>
              <Badge variant="secondary" className="text-xs">
                {metrics.pendingCount}
              </Badge>
            </div>
            <div className="space-y-2">
              {pendingRequests.slice(0, 2).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={request.profile_image} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {request.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{request.profile_name}</p>
                      <p className="text-xs text-muted-foreground">{request.profile_username}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 sm:h-6 sm:w-6 p-0 touch-manipulation"
                      onClick={() => acceptConnectionRequest(request.id)}
                    >
                      <CheckCircle className="h-4 w-4 sm:h-3 sm:w-3 text-green-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 sm:h-6 sm:w-6 p-0 touch-manipulation"
                      onClick={() => rejectConnectionRequest(request.id)}
                    >
                      <X className="h-4 w-4 sm:h-3 sm:w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {metrics.pendingCount > 2 && (
                <Link to="/connections?tab=pending" className="block text-xs text-primary hover:underline">
                  View {metrics.pendingCount - 2} more requests
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-pink-500" />
              Recent Activity
            </h4>
          </div>
          <div className="space-y-2">
            {recentActivity.slice(0, 2).map((activity) => (
              <div key={activity.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={activity.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {activity.user.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild className="h-10 sm:h-8 touch-manipulation">
            <Link to="/connections?tab=suggestions" className="flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="text-sm sm:text-xs">Find Friends</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-10 sm:h-8 touch-manipulation">
            <Link to="/messages" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="text-sm sm:text-xs">Messages</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialHubCard;