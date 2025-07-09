
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
              {connection.profile_name || 'Unknown User'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PersonSelector;
