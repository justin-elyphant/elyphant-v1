import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";

const ConnectionsWidget = () => {
  const { friends, pendingConnections, loading } = useConnectionsAdapter();
  
  const connectionCount = friends?.length || 0;
  const pendingCount = pendingConnections?.length || 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-medium mb-1">My Connections</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{connectionCount} Connection{connectionCount !== 1 ? 's' : ''}</span>
                {pendingCount > 0 && (
                  <span className="text-primary font-medium">{pendingCount} Pending</span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/connections">Manage Connections</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionsWidget;
