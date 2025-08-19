import React, { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

interface MutualConnection {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
}

interface MutualConnectionsSectionProps {
  connectionId: string;
  connectionName: string;
}

export const MutualConnectionsSection = ({ connectionId, connectionName }: MutualConnectionsSectionProps) => {
  const { user } = useAuth();
  const [mutualConnections, setMutualConnections] = useState<MutualConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Get connections for current user
        const { data: myConnections, error: myError } = await supabase
          .from('user_connections')
          .select('connected_user_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (myError) throw myError;

        // Get connections for the target connection
        const { data: theirConnections, error: theirError } = await supabase
          .from('user_connections')
          .select('connected_user_id')
          .eq('user_id', connectionId)
          .eq('status', 'accepted');

        if (theirError) throw theirError;

        // Find mutual connections
        const myConnectionIds = new Set(myConnections?.map(c => c.connected_user_id) || []);
        const mutualConnectionIds = (theirConnections || [])
          .map(c => c.connected_user_id)
          .filter(id => myConnectionIds.has(id));

        setTotalCount(mutualConnectionIds.length);

        if (mutualConnectionIds.length === 0) {
          setMutualConnections([]);
          setLoading(false);
          return;
        }

        // Get profile info for mutual connections (limit to first 4 for display)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, username, profile_image')
          .in('id', mutualConnectionIds.slice(0, 4));

        if (profilesError) throw profilesError;

        setMutualConnections(profiles || []);
      } catch (err) {
        console.error('Error fetching mutual connections:', err);
        setMutualConnections([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMutualConnections();
  }, [user?.id, connectionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-10 h-10 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mutual Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              You don't have any mutual connections with {connectionName}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Mutual Connections
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {mutualConnections.slice(0, 4).map((connection) => (
              <Avatar key={connection.id} className="w-10 h-10 border-2 border-background">
                <AvatarImage src={connection.profile_image} alt={connection.name} />
                <AvatarFallback className="text-xs">
                  {connection.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium">
              {mutualConnections.length > 0 && (
                <>
                  {mutualConnections.slice(0, 2).map(c => c.name).join(', ')}
                  {totalCount > 2 && (
                    <span className="text-muted-foreground">
                      {totalCount > 4 ? ` and ${totalCount - 2} others` : 
                       totalCount === 3 ? ` and 1 other` : 
                       totalCount === 4 ? ` and 2 others` : ''}
                    </span>
                  )}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              People you both know
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};