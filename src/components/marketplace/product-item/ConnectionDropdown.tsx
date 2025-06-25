
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gift, User, AlertCircle } from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { useAuth } from '@/contexts/auth';

interface ConnectionDropdownProps {
  productId: string;
  currentConnectionId?: string;
  onAssign: (connectionId: string | null) => void;
  className?: string;
}

const ConnectionDropdown: React.FC<ConnectionDropdownProps> = ({
  productId,
  currentConnectionId,
  onAssign,
  className = ""
}) => {
  const { user } = useAuth();
  const { friends } = useConnections();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const currentConnection = friends.find(conn => conn.id === currentConnectionId);

  const handleValueChange = (value: string) => {
    if (value === 'self') {
      onAssign(null);
    } else {
      onAssign(value);
    }
    setIsOpen(false);
  };

  return (
    <div className={`w-full ${className}`}>
      <Select value={currentConnectionId || 'self'} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue>
            <div className="flex items-center gap-1">
              {currentConnectionId ? (
                <>
                  <Gift className="h-3 w-3 text-primary" />
                  <span className="truncate">Gift to {currentConnection?.name || 'Connection'}</span>
                </>
              ) : (
                <>
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>For Myself</span>
                </>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50">
          <SelectItem value="self">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Ship to Myself</span>
            </div>
          </SelectItem>
          {friends.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t">
                Send as Gift
              </div>
              {friends.map((connection) => {
                const hasShipping = connection.dataStatus?.shipping === 'verified';
                return (
                  <SelectItem key={connection.id} value={connection.id}>
                    <div className="flex items-center gap-2 w-full">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="truncate">{connection.name}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Badge variant="outline" className="text-xs">
                          {connection.relationship}
                        </Badge>
                        {!hasShipping && (
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ConnectionDropdown;
