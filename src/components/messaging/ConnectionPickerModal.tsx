
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, User } from "lucide-react";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { toast } from "sonner";

interface ConnectionPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConnection: (connectionId: string, connectionName: string) => void;
}

const ConnectionPickerModal = ({ 
  open, 
  onOpenChange, 
  onSelectConnection 
}: ConnectionPickerModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { friends, loading } = useConnectionsAdapter();

  const filteredConnections = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectConnection = (connection: any) => {
    onSelectConnection(connection.id, connection.name || connection.username || 'Friend');
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with Connection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading connections...
              </div>
            ) : filteredConnections.length > 0 ? (
              filteredConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectConnection(connection)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={connection.profile_image} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {connection.name || connection.username || 'Unknown User'}
                    </p>
                    {connection.username && connection.name && (
                      <p className="text-xs text-muted-foreground">
                        @{connection.username}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {connection.verification_status === 'verified' && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No connections found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionPickerModal;
