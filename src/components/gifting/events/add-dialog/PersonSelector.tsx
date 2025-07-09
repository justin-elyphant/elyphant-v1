
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EnhancedConnection } from "@/hooks/profile/useEnhancedConnections";

interface PersonSelectorProps {
  connections: EnhancedConnection[];
  value: string;
  onChange: (value: string) => void;
}

const PersonSelector = ({ connections, value, onChange }: PersonSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Link to Connection (Optional)</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a connection" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No connection</SelectItem>
          {connections.map((connection) => (
            <SelectItem key={connection.id} value={connection.id}>
              <div className="flex items-center gap-2">
                <span>{connection.profile_name || 'Unknown User'}</span>
                <span className="text-xs text-muted-foreground">
                  ({connection.status === 'accepted' ? '✓ Connected' : 'Pending'})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== "none" && (
        <p className="text-xs text-muted-foreground">
          💡 Auto-gifting will have access to this friend's wishlist for gift selection
        </p>
      )}
    </div>
  );
};

export default PersonSelector;
