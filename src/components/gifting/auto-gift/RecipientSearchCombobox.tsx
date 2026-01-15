import React, { useState, useEffect, useRef, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Loader2, UserPlus, Mail, Users, Clock } from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { UnifiedGiftRule } from "@/services/UnifiedGiftManagementService";
import ExistingRulesDialog from "./ExistingRulesDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EnhancedConnection } from "@/hooks/profile/useEnhancedConnections";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { searchFriends, FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import NewRecipientForm from "@/components/shared/NewRecipientForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface RecipientSearchComboboxProps {
  value: string;
  onChange: (selection: { 
    recipientId: string; 
    recipientName?: string;
    relationshipType?: string;
    recipientDob?: string; // MM-DD format for birthday calculation
  }) => void;
  connections: EnhancedConnection[];
  pendingInvitations: EnhancedConnection[];
  sentRequests: EnhancedConnection[];
  onNewRecipientCreate: (recipient: UnifiedRecipient) => void;
  onEditExistingRule?: (rule: UnifiedGiftRule) => void;
}

export const RecipientSearchCombobox: React.FC<RecipientSearchComboboxProps> = ({
  value,
  onChange,
  connections,
  pendingInvitations,
  sentRequests,
  onNewRecipientCreate,
  onEditExistingRule,
}) => {
  const { user } = useAuth();
  const { rules } = useAutoGifting();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [existingRulesDialogOpen, setExistingRulesDialogOpen] = useState(false);
  const [selectedRecipientWithRules, setSelectedRecipientWithRules] = useState<{
    name: string;
    id: string;
    rules: UnifiedGiftRule[];
  } | null>(null);

  // Get selected connection name for display
  const selectedConnection = 
    connections.find(c => (c.display_user_id || c.connected_user_id) === value || c.id === value) ||
    pendingInvitations.find(c => (c.display_user_id || c.connected_user_id) === value || c.id === value) ||
    sentRequests.find(c => (c.display_user_id || c.connected_user_id) === value || c.id === value);
  
  const selectedName = selectedConnection?.profile_name || (selectedConnection as any)?.pending_recipient_name || selectedLabel || "Select a recipient";

  // Filter accepted connections - memoized to prevent infinite loops
  const acceptedConnections = useMemo(
    () => connections.filter(c => c.status === 'accepted'),
    [connections]
  );
  
  // Memoize existing user IDs to prevent array recreation
  const existingUserIds = useMemo(() => {
    return new Set([
      ...acceptedConnections.map(c => c.display_user_id || c.connected_user_id),
      ...pendingInvitations.map(c => c.display_user_id || c.connected_user_id),
      ...sentRequests.map(c => c.display_user_id || c.connected_user_id)
    ].filter(Boolean));
  }, [acceptedConnections, pendingInvitations, sentRequests]);

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
    // Use longer debounce on mobile to reduce UI thread blocking
    const debounceTime = isMobile ? 500 : 300;
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[RecipientSearchCombobox] performing search for:', searchQuery);
        const results = await searchFriends(searchQuery, user?.id);
        
        // Use memoized existingUserIds
        let filteredResults = results.filter(r => !existingUserIds.has(r.id));
        console.log('[RecipientSearchCombobox] raw results:', results.length, 'filtered:', filteredResults.length);

        setSearchResults(filteredResults);

        // Defer secondary status verification to idle time (iOS Capacitor optimization)
        if (user?.id && filteredResults.length > 0) {
          const verifyStatus = async () => {
            try {
              const ids = filteredResults.map(r => r.id).join(',');
              const { data: connRows, error: connErr } = await supabase
                .from('user_connections')
                .select('user_id, connected_user_id, status')
                .or(`and(user_id.eq.${user.id},connected_user_id.in.(${ids})),and(user_id.in.(${ids}),connected_user_id.eq.${user.id})`);
              
              if (!connErr && connRows) {
                setSearchResults(prev => prev.map(r => {
                  const rows = connRows.filter(row => row.user_id === user.id ? row.connected_user_id === r.id : row.user_id === r.id);
                  const hasAccepted = rows.some(row => row.status === 'accepted');
                  const hasPending = rows.some(row => row.status === 'pending');
                  return hasAccepted
                    ? { ...r, connectionStatus: 'connected' }
                    : hasPending
                    ? { ...r, connectionStatus: 'pending' }
                    : r;
                }));
              }
            } catch (statusErr) {
              console.warn('[RecipientSearchCombobox] status verification error:', statusErr);
            }
          };
          
          // Use requestIdleCallback if available, otherwise setTimeout
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(verifyStatus);
          } else {
            setTimeout(verifyStatus, 100);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error("Error searching for users");
      } finally {
        setIsSearching(false);
      }
    }, debounceTime);

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
        
        // Select the user as the recipient so they can proceed with auto-gift setup
        setSelectedLabel(targetName);
        onChange({ 
          recipientId: targetUserId,
          recipientName: targetName,
          relationshipType: 'friend'
        });
        
        // Update search results to show pending status
        setSearchResults(prev => prev.map(r => 
          r.id === targetUserId 
            ? { ...r, connectionStatus: 'pending' }
            : r
        ));
        
        // Close the popover after successful request
        setOpen(false);
        setSearchQuery("");
      } else {
        const msg = result.error?.message || '';
        if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('pending')) {
          toast.info(`Connection request to ${targetName} is already pending`);
          setOpen(false);
          setSearchQuery("");
          setSearchResults(prev => prev.map(r => r.id === targetUserId ? { ...r, connectionStatus: 'pending' } : r));
        } else if (msg.toLowerCase().includes('exists')) {
          toast.info(`You're already connected or have a request pending with ${targetName}`);
          setOpen(false);
          setSearchQuery("");
        } else {
          toast.error("Failed to send connection request");
        }
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error("Failed to send connection request");
    } finally {
      setSendingRequestTo(null);
    }
  };

  const handleSelect = async (recipientId: string, recipientName?: string, relationshipType?: string) => {
    // Check if this recipient has existing rules
    const existingRules = rules.filter(rule => {
      // Match by recipient_id or pending_recipient_email
      if (rule.recipient_id && rule.recipient_id === recipientId) {
        return true;
      }
      if (rule.pending_recipient_email && rule.pending_recipient_email === recipientId) {
        return true;
      }
      return false;
    });

    // Fetch recipient's DOB from profiles for birthday calculation
    let recipientDob: string | undefined;
    if (recipientId && !recipientId.includes('@')) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('dob')
          .eq('id', recipientId)
          .single();
        
        if (profile?.dob) {
          // Handle both MM-DD and full date formats
          if (profile.dob.length === 5 && profile.dob.includes('-')) {
            // Already in MM-DD format
            recipientDob = profile.dob;
          } else {
            // Convert full DOB to MM-DD format for birthday calculation
            const dobDate = new Date(profile.dob);
            const month = String(dobDate.getMonth() + 1).padStart(2, '0');
            const day = String(dobDate.getDate()).padStart(2, '0');
            recipientDob = `${month}-${day}`;
          }
          console.log(`📅 Fetched recipient DOB: ${recipientDob}`);
        }
      } catch (error) {
        console.warn('Could not fetch recipient DOB:', error);
      }
    }

    if (existingRules.length > 0 && onEditExistingRule) {
      // Show existing rules dialog
      setSelectedRecipientWithRules({
        name: recipientName || 'Recipient',
        id: recipientId,
        rules: existingRules
      });
      setExistingRulesDialogOpen(true);
      setOpen(false);
    } else {
      // Proceed with normal selection, including DOB
      onChange({ recipientId, recipientName, relationshipType, recipientDob });
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleNewRecipientCreated = (recipient: UnifiedRecipient) => {
    setShowNewRecipientForm(false);
    onNewRecipientCreate(recipient);
    setOpen(false);
  };

  // Shared content component to avoid duplication
  const RecipientSelectorContent = () => {
    // Filter connections based on search query
    const filteredConnections = searchQuery.length >= 2
      ? acceptedConnections.filter(c => 
          c.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.profile_username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : acceptedConnections;

    const filteredPendingInvitations = searchQuery.length >= 2
      ? pendingInvitations.filter(inv => 
          inv.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.pending_recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.pending_recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : pendingInvitations;

    const filteredSentRequests = searchQuery.length >= 2
      ? sentRequests.filter(req => 
          req.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.profile_username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sentRequests;

    return (
      <>
        <div className="flex items-center border-b px-3 py-2 cursor-text" onClick={() => inputRef.current?.focus()}>
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            id="recipient-search-input"
            ref={inputRef}
            type="text"
            placeholder="Search friends..."
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

      {/* Invite New User - Top Priority Action */}
      <div className="p-2 bg-gradient-to-r from-purple-50 to-sky-50 dark:from-purple-950/20 dark:to-sky-950/20 border-b border-border/50">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowNewRecipientForm(true);
            setOpen(false);
          }}
          className="w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm bg-background hover:bg-accent cursor-pointer text-foreground min-h-[44px] border border-border/50 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-sky-500 flex-shrink-0">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold">Invite Someone New</div>
            <div className="text-xs text-muted-foreground">
              Add someone not on Elyphant yet
            </div>
          </div>
        </button>
      </div>

        <div className="max-h-[50vh] overflow-y-auto ios-smooth-scroll scrollbar-hide pb-24">
          {/* Your Connections Section */}
          {filteredConnections.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Your Connections
              </div>
                {filteredConnections.map((connection) => {
                const connectionId = connection.display_user_id || connection.connected_user_id;
                const isSelected = value === connectionId;
                
                return (
                  <button
                    key={connection.id}
                    onClick={() => handleSelect(
                      connectionId!, 
                      connection.profile_name || undefined, 
                      connection.relationship_type || undefined
                    )}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-sm px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform duration-75",
                      isSelected && "bg-accent"
                    )}
                  >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={connection.profile_image} loading="lazy" />
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
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                    {connection.relationship_type}
                  </Badge>
                  {isSelected && <Check className="h-4 w-4 text-purple-600" />}
                </button>
              );
            })}
          </div>
        )}

          {/* Pending Invitations Section */}
          {filteredPendingInvitations.length > 0 && (
            <>
              {filteredConnections.length > 0 && <Separator className="my-1" />}
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending Invitations
                </div>
                {filteredPendingInvitations.map((invitation) => {
                const isSelected = value === invitation.id;
                
                return (
                  <button
                    key={invitation.id}
                    onClick={() => handleSelect(
                      invitation.id, 
                      invitation.profile_name || invitation.pending_recipient_name || undefined,
                      invitation.relationship_type || undefined
                    )}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-sm px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px]",
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
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                      Pending
                    </Badge>
                    {isSelected && <Check className="h-4 w-4 text-purple-600" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

          {/* Sent Requests Section */}
          {filteredSentRequests.length > 0 && (
            <>
              {(filteredConnections.length > 0 || filteredPendingInvitations.length > 0) && <Separator className="my-1" />}
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Request Sent
                </div>
                {filteredSentRequests.map((request) => {
                const requestId = request.connected_user_id || request.display_user_id;
                const isSelected = value === requestId;
                
                return (
                  <button
                    key={request.id}
                    onClick={() => handleSelect(
                      requestId!, 
                      request.profile_name || undefined,
                      request.relationship_type || undefined
                    )}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-sm px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px]",
                      isSelected && "bg-accent"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.profile_image} />
                      <AvatarFallback>
                        {request.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{request.profile_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {request.profile_username}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                      Request Sent
                    </Badge>
                    {isSelected && <Check className="h-4 w-4 text-purple-600" />}
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

          {/* Search Results Section - New Users */}
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <>
              {(filteredConnections.length > 0 || filteredPendingInvitations.length > 0) && <Separator className="my-1" />}
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Search Results
              </div>
              {searchResults.map((result) => {
                const isClickable = result.connectionStatus === 'connected' || result.connectionStatus === 'pending';
                
                return (
                  <div
                    key={result.id}
                    className={`flex items-center gap-3 rounded-sm px-3 py-3 text-sm hover:bg-accent min-h-[44px] ${isClickable ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isClickable) {
                        setSelectedLabel(result.name || null);
                        onChange({ 
                          recipientId: result.id,
                          recipientName: result.name,
                          relationshipType: 'friend'
                        });
                        setOpen(false);
                        setSearchQuery("");
                      }
                    }}
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
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">Connected</Badge>
                    )}
                    {result.connectionStatus === 'pending' && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">Request Sent</Badge>
                    )}
                    {result.connectionStatus === 'none' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendConnectionRequest(result.id, result.name);
                        }}
                        disabled={sendingRequestTo === result.id}
                        className="h-8 text-xs min-w-[120px]"
                      >
                        {sendingRequestTo === result.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 mr-1.5" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

          {/* No Results */}
          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && filteredConnections.length === 0 && filteredPendingInvitations.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found. Try inviting them via email at the top.
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform duration-75"
            >
              <span className="truncate">{selectedName}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh] pb-safe bg-background/95 backdrop-blur-xl">
            <VisuallyHidden>
              <DrawerTitle>Select a Recipient</DrawerTitle>
            </VisuallyHidden>
            <div className="w-full max-h-[calc(85vh-60px)] overflow-y-auto ios-smooth-scroll overscroll-contain touch-pan-y">
              <RecipientSelectorContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between pointer-events-auto"
            >
              <span className="truncate">{selectedName}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="max-w-[440px] w-[440px] p-0 z-[10000] pointer-events-auto bg-background border shadow-xl"
            align="start"
            side="bottom"
            sideOffset={8}
            avoidCollisions={true}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
          >
            <RecipientSelectorContent />
          </PopoverContent>
        </Popover>
      )}

      {/* New Recipient Form Dialog */}
      <Dialog open={showNewRecipientForm} onOpenChange={setShowNewRecipientForm}>
        <DialogContent className="p-0 pb-24 md:pb-6">
          <NewRecipientForm
            onRecipientCreate={handleNewRecipientCreated}
            onCancel={() => setShowNewRecipientForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Existing Rules Dialog */}
      {selectedRecipientWithRules && (
        <ExistingRulesDialog
          open={existingRulesDialogOpen}
          onOpenChange={setExistingRulesDialogOpen}
          recipientName={selectedRecipientWithRules.name}
          rules={selectedRecipientWithRules.rules}
          onEditRule={(rule) => {
            if (onEditExistingRule) {
              onEditExistingRule(rule);
            }
          }}
          onCreateNew={() => {
            onChange({
              recipientId: selectedRecipientWithRules.id,
              recipientName: selectedRecipientWithRules.name
            });
          }}
        />
      )}
    </>
  );
};
