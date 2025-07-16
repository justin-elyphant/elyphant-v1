import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Connection } from "@/types/connections";
import { Mail, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingTabContentProps {
  pendingConnections: Connection[];
  searchTerm: string;
}

const PendingTabContent: React.FC<PendingTabContentProps> = ({ 
  pendingConnections, 
  searchTerm 
}) => {
  if (pendingConnections.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No pending connections</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm 
            ? `No results for "${searchTerm}"`
            : "You haven't sent any gift invitations yet"}
        </p>
        <Button>
          Send Your First Gift
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {pendingConnections.map(connection => (
        <Card key={connection.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={connection.imageUrl} alt={connection.name} />
                <AvatarFallback>
                  {connection.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-base">{connection.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <Mail className="h-3 w-3" />
                  <span>{connection.recipientEmail}</span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {connection.bio}
                </p>
                
                {connection.connectionDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Sent {formatDistanceToNow(new Date(connection.connectionDate), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {connection.relationship}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PendingTabContent;