
import React from "react";
import { Link } from "react-router-dom";
import { Users, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConnections } from "@/hooks/profile/useConnections";
import { Skeleton } from "@/components/ui/skeleton";

const FriendsCard = () => {
  const { connections, loading, error } = useConnections();

  // Filter accepted connections that are friends or follows
  const friends = connections.filter(conn => 
    conn.status === 'accepted' && 
    (conn.relationship_type === 'friend' || conn.relationship_type === 'follow')
  ).slice(0, 3); // Show only first 3 friends

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-500" />
                Friends
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Connect with friends to share wishlists
              </CardDescription>
            </div>
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 text-purple-700 hover:text-purple-800"
            >
              <Link to="/messages" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Messages</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-gray-500" />
                Friends
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Connect with friends to share wishlists
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Unable to load friends</p>
            <Button className="mt-2" asChild>
              <Link to="/connections">Try Again</Link>
            </Button>
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
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              Friends
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Connect with friends to share wishlists
            </CardDescription>
          </div>
          <Button 
            asChild 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 text-purple-700 hover:text-purple-800"
          >
            <Link to="/messages" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Messages</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                        {connection.connected_user_id.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {connection.relationship_type === 'friend' ? 'Friend' : 'Following'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connection.relationship_type}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/user/${connection.connected_user_id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No friends yet</p>
            </div>
          )}
          
          <Button className="w-full" asChild>
            <Link to="/connections">Find Friends</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsCard;
