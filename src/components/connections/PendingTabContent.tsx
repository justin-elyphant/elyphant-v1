import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Connection } from "@/types/connections";
import { Mail, Calendar, Clock, Edit, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PendingConnectionEditModal from "./PendingConnectionEditModal";
import NudgeModal from "./NudgeModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PendingTabContentProps {
  pendingConnections: Connection[];
  searchTerm: string;
  onRefresh?: () => void;
}

const PendingTabContent: React.FC<PendingTabContentProps> = ({ 
  pendingConnections, 
  searchTerm,
  onRefresh
}) => {
  const { user } = useAuth();
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [nudgingConnection, setNudgingConnection] = useState<Connection | null>(null);
  const [nudgeStates, setNudgeStates] = useState<Record<string, {
    totalNudges: number;
    lastNudgeSent: Date | null;
    canNudge: boolean;
    daysUntilNextNudge: number;
  }>>({});

  // Fetch nudge states for all connections
  useEffect(() => {
    const fetchNudgeStates = async () => {
      if (!user || pendingConnections.length === 0) return;

      const states: typeof nudgeStates = {};
      for (const connection of pendingConnections) {
        if (connection.recipientEmail) {
          try {
            const { data } = await supabase.rpc('get_nudge_summary', {
              p_user_id: user.id,
              p_recipient_email: connection.recipientEmail
            });
            
            if (data && data.length > 0) {
              const summary = data[0];
              states[connection.id] = {
                totalNudges: summary.total_nudges,
                lastNudgeSent: summary.last_nudge_sent ? new Date(summary.last_nudge_sent) : null,
                canNudge: summary.can_nudge,
                daysUntilNextNudge: summary.days_until_next_nudge
              };
            } else {
              states[connection.id] = {
                totalNudges: 0,
                lastNudgeSent: null,
                canNudge: true,
                daysUntilNextNudge: 0
              };
            }
          } catch (error) {
            console.error('Error fetching nudge state:', error);
            states[connection.id] = {
              totalNudges: 0,
              lastNudgeSent: null,
              canNudge: true,
              daysUntilNextNudge: 0
            };
          }
        }
      }
      setNudgeStates(states);
    };

    fetchNudgeStates();
  }, [user, pendingConnections]);

  const handleNudgeSuccess = () => {
    // Refresh nudge states after sending a nudge
    if (nudgingConnection) {
      const refreshNudgeState = async () => {
        if (!user || !nudgingConnection.recipientEmail) return;

        try {
          const { data } = await supabase.rpc('get_nudge_summary', {
            p_user_id: user.id,
            p_recipient_email: nudgingConnection.recipientEmail
          });
          
          if (data && data.length > 0) {
            const summary = data[0];
            setNudgeStates(prev => ({
              ...prev,
              [nudgingConnection.id]: {
                totalNudges: summary.total_nudges,
                lastNudgeSent: summary.last_nudge_sent ? new Date(summary.last_nudge_sent) : null,
                canNudge: summary.can_nudge,
                daysUntilNextNudge: summary.days_until_next_nudge
              }
            }));
          }
        } catch (error) {
          console.error('Error refreshing nudge state:', error);
        }
      };

      refreshNudgeState();
    }
    onRefresh?.();
  };
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
              
              {/* Show nudge information */}
              {nudgeStates[connection.id] && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {nudgeStates[connection.id].totalNudges > 0 && (
                    <span>
                      {nudgeStates[connection.id].totalNudges}/3 nudges
                    </span>
                  )}
                  {nudgeStates[connection.id].lastNudgeSent && (
                    <span className="text-xs">
                      (Last: {formatDistanceToNow(nudgeStates[connection.id].lastNudgeSent!, { addSuffix: true })})
                    </span>
                  )}
                </div>
              )}
              
              {/* Nudge button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNudgingConnection(connection)}
                className="h-8 w-8 p-0"
                disabled={!nudgeStates[connection.id]?.canNudge}
                title={
                  nudgeStates[connection.id]?.canNudge 
                    ? "Send reminder" 
                    : nudgeStates[connection.id]?.daysUntilNextNudge > 0
                      ? `Can send reminder in ${nudgeStates[connection.id]?.daysUntilNextNudge} days`
                      : "Maximum nudges reached"
                }
              >
                <Send className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingConnection(connection)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {editingConnection && (
        <PendingConnectionEditModal
          connection={editingConnection}
          open={!!editingConnection}
          onOpenChange={(open) => !open && setEditingConnection(null)}
          onSuccess={() => {
            setEditingConnection(null);
            onRefresh?.();
          }}
        />
      )}
      
      {nudgingConnection && (
        <NudgeModal
          connection={nudgingConnection}
          open={!!nudgingConnection}
          onOpenChange={(open) => !open && setNudgingConnection(null)}
          onSuccess={handleNudgeSuccess}
        />
      )}
    </div>
  );
};

export default PendingTabContent;