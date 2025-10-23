import React, { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Loader2, UserPlus, Mail, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EnhancedConnection } from "@/hooks/profile/useEnhancedConnections";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { searchFriends, FriendSearchResult } from "@/services/search/friendSearchService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import NewRecipientForm from "@/components/shared/NewRecipientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface RecipientSearchComboboxProps {
  value: string;
  onChange: (recipientId: string) => void;
  connections: EnhancedConnection[];
  pendingInvitations: EnhancedConnection[];
  onNewRecipientCreate: (recipient: UnifiedRecipient) => void;
}

export const RecipientSearchCombobox: React.FC<RecipientSearchComboboxProps> = ({
  value,
  onChange,
  connections,
  pendingInvitations,
  onNewRecipientCreate,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  // Get selected connection name for display
  const selectedConnection = 
    connections.find(c => (c.display_user_id || c.connected_user_id) === value) ||
    pendingInvitations.find(c => c.id === value);
  
  const selectedName = selectedConnection?.profile_name || "Select a recipient";

  // Filter accepted connections - memoized to prevent infinite loops
  const acceptedConnections = useMemo(
    () => connections.filter(c => c.status === 'accepted'),
    [connections]
  );
  
  // Memoize existing user IDs to prevent array recreation
  const existingUserIds = useMemo(() => {
    return new Set([
      ...acceptedConnections.map(c => c.display_user_id || c.connected_user_id),
      ...pendingInvitations.map(c => c.display_user_id || c.connected_user_id)
    ].filter(Boolean));
  }, [acceptedConnections, pendingInvitations]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    console.log('[RecipientSearchCombobox] effect', { query: searchQuery, len: searchQuery.trim().length });

    // Clear results when query is short, but avoid redundant state updates
    if (searchQuery.trim().length < 2) {
      if (isSearching) setIsSearching(false);
      if (searchResults.length !== 0) setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[RecipientSearchCombobox] performing search for:', searchQuery);
        const results = await searchFriends(searchQuery, user?.id);
        
        // Use memoized existingUserIds
        const filteredResults = results.filter(r => !existingUserIds.has(r.id));
        console.log('[RecipientSearchCombobox] raw results:', results.length, 'filtered:', filteredResults.length);
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        toast.error("Error searching for users");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, user?.id, existingUserIds]);

  const handleSendConnectionRequest = async (targetUserId: string, targetName: string) => {
    if (!user) return;

    setSendingRequestTo(targetUserId);
    try {
      const { sendConnectionRequest } = await import('@/services/connections/connectionService');
      const result = await sendConnectionRequest(targetUserId, 'friend');
      
      if (result.success) {
        toast.success(`Connection request sent to ${targetName}`);
        
        // Update search results to show pending status
        setSearchResults(prev => prev.map(r => 
          r.id === targetUserId 
            ? { ...r, connectionStatus: 'pending' }
            : r
        ));
      } else {
        toast.error("Failed to send connection request");
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error("Failed to send connection request");
    } finally {
      setSendingRequestTo(null);
    }
  };

  const handleSelect = (recipientId: string) => {
    onChange(recipientId);
    setOpen(false);
    setSearchQuery("");
  };

  const handleNewRecipientCreated = (recipient: UnifiedRecipient) => {
    setShowNewRecipientForm(false);
    onNewRecipientCreate(recipient);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{selectedName}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <div ref={popoverContainerRef} />
        <PopoverContent 
          className="w-[400px] p-0 z-[10000] pointer-events-auto bg-background shadow-md border" 
          align="start"
          container={popoverContainerRef.current ?? undefined}
          onOpenAutoFocus={(e)=>{
            e.preventDefault();
            setTimeout(()=>{
              inputRef.current?.focus();
            },0)
          }}
        >
          <div className="flex items-center border-b px-3 py-2 cursor-text" onClick={() => inputRef.current?.focus()}>
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              id="recipient-search-input"
              ref={inputRef}
              type="text"
              placeholder="Search connections or find people..."
              value={searchQuery}
              onChange={(e) => {
                console.log('[RecipientSearchCombobox] input change:', e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
              autoComplete="off"
              autoFocus
              onFocus={() => console.log('[RecipientSearchCombobox] input focused')}
            />
            {isSearching && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin opacity-50" />
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {/* Your Connections Section */}
            {acceptedConnections.length > 0 && searchQuery.length < 2 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Your Connections
                </div>
                {acceptedConnections.map((connection) => {
                  const connectionId = connection.display_user_id || connection.connected_user_id;
                  const isSelected = value === connectionId;
                  
                  return (
                    <button
                      key={connection.id}
                      onClick={() => handleSelect(connectionId!)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent cursor-pointer",
                        isSelected && "bg-accent"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={connection.profile_image} />
                        <AvatarFallback>
                          {connection.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{connection.profile_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {connection.profile_username}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {connection.relationship_type}
                      </Badge>
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pending Invitations Section */}
            {pendingInvitations.length > 0 && searchQuery.length < 2 && (
              <>
                {acceptedConnections.length > 0 && <Separator />}
                <div className="p-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending Invitations
                  </div>
                  {pendingInvitations.map((invitation) => {
                    const isSelected = value === invitation.id;
                    
                    return (
                      <button
                        key={invitation.id}
                        onClick={() => handleSelect(invitation.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent cursor-pointer",
                          isSelected && "bg-accent"
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {invitation.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{invitation.profile_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {invitation.pending_recipient_email}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                          Pending
                        </Badge>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Helper hint when nothing to show yet */}
            {searchQuery.length < 2 && acceptedConnections.length === 0 && pendingInvitations.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">
                Type 2+ characters to search all Elyphant users
              </div>
            )}

            {/* Search Results Section */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <>
                {(acceptedConnections.length > 0 || pendingInvitations.length > 0) && <Separator />}
                <div className="p-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Search Results
                  </div>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.profile_image} />
                        <AvatarFallback>
                          {result.name?.substring(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.username}
                          {(result.city || result.state) && (
                            <span className="ml-1.5">
                              • {[result.city, result.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      {result.connectionStatus === 'connected' && (
                        <Badge variant="secondary" className="text-xs">Connected</Badge>
                      )}
                      {result.connectionStatus === 'pending' && (
                        <Badge variant="outline" className="text-xs">Request Sent</Badge>
                      )}
                      {result.connectionStatus === 'none' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendConnectionRequest(result.id, result.name)}
                          disabled={sendingRequestTo === result.id}
                          className="h-7 text-xs"
                        >
                          {sendingRequestTo === result.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Send Request
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* No Results */}
            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found. Try adding via email below.
              </div>
            )}

            {/* Add New Recipient Action */}
            <Separator />
            <div className="p-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNewRecipientForm(true);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent cursor-pointer text-primary"
              >
                <Mail className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Send invitation via email</div>
                  <div className="text-xs text-muted-foreground">
                    Add someone not on Elyphant yet
                  </div>
                </div>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* New Recipient Form Dialog */}
      <Dialog open={showNewRecipientForm} onOpenChange={setShowNewRecipientForm}>
        <DialogContent>
          <NewRecipientForm
            onRecipientCreate={handleNewRecipientCreated}
            onCancel={() => setShowNewRecipientForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
