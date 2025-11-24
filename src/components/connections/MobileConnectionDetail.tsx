import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Connection } from "@/types/connections";
import { ArrowLeft, MessageCircle, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { AutoGiftToggle } from "./AutoGiftToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getRelationshipIcon, getRelationshipLabel } from "./RelationshipUtils";
import { useAutoGiftPermission } from "@/hooks/useAutoGiftPermission";

interface MobileConnectionDetailProps {
  connection: Connection;
  onBack: () => void;
  onRelationshipChange: (connectionId: string, newRelationship: string, customValue?: string) => void;
  onAutoGiftToggle: (connectionId: string, enabled: boolean) => void;
}

const MobileConnectionDetail: React.FC<MobileConnectionDetailProps> = ({
  connection,
  onBack,
  onRelationshipChange,
  onAutoGiftToggle,
}) => {
  const { permissionResult, loading: permissionLoading } = useAutoGiftPermission(connection);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Connection Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Profile */}
        <div className="text-center space-y-3">
          <Avatar className="h-32 w-32 mx-auto">
            <AvatarImage src={connection.imageUrl} alt={connection.name} />
            <AvatarFallback className="text-3xl">{connection.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{connection.name}</h2>
            <p className="text-muted-foreground">{connection.username}</p>
          </div>
          {connection.bio && <p className="text-sm">{connection.bio}</p>}
        </div>

        {/* Interests */}
        {connection.interests && connection.interests.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {connection.interests.map((interest) => (
                <Badge key={interest} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Relationship */}
        <div className="space-y-2">
          <h3 className="font-medium">Relationship</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                {getRelationshipIcon(connection.relationship)}
                <span>{getRelationshipLabel(connection.relationship, connection.customRelationship)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)]">
              <DropdownMenuItem onClick={() => onRelationshipChange(connection.id, 'friend')}>
                Friend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRelationshipChange(connection.id, 'spouse')}>
                Spouse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRelationshipChange(connection.id, 'cousin')}>
                Cousin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Auto-Gift */}
        <div className="space-y-2">
          <h3 className="font-medium">Auto-Gift Settings</h3>
          <AutoGiftToggle
            connectionName={connection.name}
            connectionId={connection.id}
            isEnabled={permissionResult?.isAutoGiftEnabled ?? false}
            isLoading={permissionLoading}
            onToggle={onAutoGiftToggle}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" asChild>
            <Link to={`/messages/${connection.id}`}>
              <MessageCircle className="h-5 w-5 mr-2" />
              Message
            </Link>
          </Button>
          <Button variant="outline" size="lg">
            <Gift className="h-5 w-5 mr-2" />
            Gift
          </Button>
        </div>

        {/* View Profile */}
        <Button className="w-full" size="lg" asChild>
          <Link to={`/profile/${connection.id}?context=connection`}>
            View Full Profile
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MobileConnectionDetail;
