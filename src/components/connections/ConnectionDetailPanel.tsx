import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Connection } from "@/types/connections";
import { MessageCircle, Gift, User, Heart, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AutoGiftToggle } from "./AutoGiftToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getRelationshipIcon, getRelationshipLabel } from "./RelationshipUtils";
import { useAutoGiftPermission } from "@/hooks/useAutoGiftPermission";

interface ConnectionDetailPanelProps {
  connection: Connection;
  onClose: () => void;
  onRelationshipChange: (connectionId: string, newRelationship: string, customValue?: string) => void;
  onAutoGiftToggle: (connectionId: string, enabled: boolean) => void;
}

const ConnectionDetailPanel: React.FC<ConnectionDetailPanelProps> = ({
  connection,
  onClose,
  onRelationshipChange,
  onAutoGiftToggle,
}) => {
  const { permissionResult, loading: permissionLoading } = useAutoGiftPermission(connection);

  return (
    <Card className="h-full border-l">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Connection Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Profile Section */}
        <div className="text-center space-y-3">
          <Avatar className="h-24 w-24 mx-auto">
            <AvatarImage src={connection.imageUrl} alt={connection.name} />
            <AvatarFallback className="text-2xl">{connection.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{connection.name}</h3>
            <p className="text-sm text-muted-foreground">{connection.username}</p>
          </div>
          {connection.bio && (
            <p className="text-sm text-muted-foreground">{connection.bio}</p>
          )}
        </div>

        {/* Interests */}
        {connection.interests && connection.interests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {connection.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Relationship */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Relationship</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                {getRelationshipIcon(connection.relationship)}
                <span>{getRelationshipLabel(connection.relationship, connection.customRelationship)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full">
              <DropdownMenuItem onClick={() => onRelationshipChange(connection.id, 'friend')}>
                <User className="h-4 w-4 mr-2" /> Friend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRelationshipChange(connection.id, 'spouse')}>
                <Heart className="h-4 w-4 mr-2" /> Spouse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRelationshipChange(connection.id, 'cousin')}>
                <User className="h-4 w-4 mr-2" /> Cousin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Auto-Gift Settings */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Auto-Gift</h4>
          <AutoGiftToggle
            connectionName={connection.name}
            connectionId={connection.id}
            isEnabled={permissionResult?.isAutoGiftEnabled ?? false}
            isLoading={permissionLoading}
            onToggle={onAutoGiftToggle}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/messages/${connection.id}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Gift className="h-4 w-4 mr-2" />
              Gift
            </Button>
          </div>
        </div>

        {/* View Full Profile */}
        <Button className="w-full" asChild>
          <Link to={`/profile/${connection.id}?context=connection`}>
            View Full Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionDetailPanel;
