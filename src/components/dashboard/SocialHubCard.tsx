
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Gift, 
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { SocialActivity } from "@/services/socialActivityService";

const SocialHubCard = () => {
  const navigate = useNavigate();
  const { activities, connectionStats, loading, error } = useActivityFeed(8);

  const getActivityIcon = (type: SocialActivity['type']) => {
    switch (type) {
      case 'connection':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'wishlist':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'address':
        return <MapPin className="h-4 w-4 text-orange-500" />;
      case 'gift_search':
        return <Gift className="h-4 w-4 text-purple-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: SocialActivity['type']) => {
    switch (type) {
      case 'connection':
        return 'bg-blue-50 border-blue-200';
      case 'wishlist':
        return 'bg-pink-50 border-pink-200';
      case 'message':
        return 'bg-green-50 border-green-200';
      case 'address':
        return 'bg-orange-50 border-orange-200';
      case 'gift_search':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Social Hub</CardTitle>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Social Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load social activities</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Social Hub
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {connectionStats.accepted} friends
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Stats */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{connectionStats.accepted}</div>
            <div className="text-xs text-muted-foreground">Friends</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{connectionStats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{activities.length}</div>
            <div className="text-xs text-muted-foreground">Recent</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Activity
          </h4>
          
          {activities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent social activity</p>
              <p className="text-xs">Connect with friends to see updates!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${getActivityColor(activity.type)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.image} alt={activity.user.name} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate">{activity.user.name}</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1">
                      {activity.description}
                    </p>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/connections")}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Connections
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/messages")}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </Button>
        </div>

        {connectionStats.pending > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/connections?tab=pending")}
            className="w-full"
          >
            <span className="flex items-center justify-center gap-2">
              Review {connectionStats.pending} Pending Request{connectionStats.pending > 1 ? 's' : ''}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialHubCard;
