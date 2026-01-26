import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, User, Users, Clock, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useEnhancedConnections, EnhancedConnection } from "@/hooks/profile/useEnhancedConnections";
import { triggerHapticFeedback } from "@/utils/haptics";

export interface SelectedRecipient {
  type: 'self' | 'connection' | 'later';
  connectionId?: string;
  connectionName?: string;
  shippingAddress?: {
    name: string;
    address: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  addressVerified?: boolean;
}

interface SimpleRecipientSelectorProps {
  value: SelectedRecipient | null;
  onChange: (recipient: SelectedRecipient) => void;
  userAddress?: any; // User's own shipping address from profile
  userName?: string;
  onInviteNew?: (name: string, email: string) => void;
}

export const SimpleRecipientSelector: React.FC<SimpleRecipientSelectorProps> = ({
  value,
  onChange,
  userAddress,
  userName = "Myself",
  onInviteNew
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { connections, pendingInvitations, loading } = useEnhancedConnections();
  
  // Auto-scroll to expanded content
  useEffect(() => {
    if (open && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [open]);
  
  // Filter accepted connections and sort by most recently added (fallback until gift history available)
  const acceptedConnections = useMemo(() => {
    const accepted = connections.filter(c => c.status === 'accepted');
    // Sort by created_at DESC (most recently added first)
    // TODO: When gift history is available, sort by last_gift_date DESC instead
    return accepted.sort((a, b) => {
      const aDate = a.created_at || '';
      const bDate = b.created_at || '';
      return bDate.localeCompare(aDate);
    });
  }, [connections]);
  
  // Filter based on search
  const filteredConnections = useMemo(() => {
    if (searchQuery.length < 2) return acceptedConnections;
    return acceptedConnections.filter(c => 
      c.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.profile_username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [acceptedConnections, searchQuery]);
  
  // Limit to top 3 when not searching
  const displayConnections = useMemo(() => {
    if (searchQuery.trim().length >= 2) return filteredConnections; // Show all matches when searching
    return filteredConnections.slice(0, 3); // Limit to top 3 when not searching
  }, [filteredConnections, searchQuery]);
  
  const hasMoreConnections = !searchQuery.trim() && filteredConnections.length > 3;
  
  const filteredPending = useMemo(() => {
    if (searchQuery.length < 2) return pendingInvitations;
    return pendingInvitations.filter(inv => 
      inv.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.pending_recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pendingInvitations, searchQuery]);

  // Get display label
  const getDisplayLabel = () => {
    if (!value) return "Select recipient";
    if (value.type === 'self') return `Ship to ${userName}`;
    if (value.type === 'later') return "Assign recipient in cart";
    if (value.connectionName) return value.connectionName;
    return "Select recipient";
  };

  const handleSelectSelf = () => {
    triggerHapticFeedback('light');
    onChange({
      type: 'self',
      connectionId: 'self',
      connectionName: userName,
      shippingAddress: userAddress ? {
        name: userAddress.name || userName,
        address: userAddress.address_line1 || userAddress.street || '',
        addressLine2: userAddress.address_line2 || userAddress.line2 || '',
        city: userAddress.city || '',
        state: userAddress.state || '',
        zipCode: userAddress.zip_code || userAddress.zipCode || '',
        country: userAddress.country || 'US'
      } : undefined,
      addressVerified: true
    });
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectLater = () => {
    triggerHapticFeedback('light');
    onChange({
      type: 'later'
    });
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectConnection = (connection: EnhancedConnection) => {
    triggerHapticFeedback('light');
    // For pending invitations, use pending_shipping_address
    // For accepted connections, use profile_shipping_address
    const rawAddress = connection.pending_shipping_address || connection.profile_shipping_address;
    const shippingAddress = rawAddress ? {
      name: connection.profile_name || connection.pending_recipient_name || '',
      address: rawAddress.address_line1 || rawAddress.street || '',
      addressLine2: rawAddress.address_line2 || rawAddress.line2 || '',
      city: rawAddress.city || '',
      state: rawAddress.state || '',
      zipCode: rawAddress.zip_code || rawAddress.zipCode || '',
      country: rawAddress.country || 'US',
      phone: rawAddress.phone || ''
    } : undefined;

    onChange({
      type: 'connection',
      connectionId: connection.display_user_id || connection.connected_user_id || connection.id,
      connectionName: connection.profile_name || connection.pending_recipient_name || 'Recipient',
      shippingAddress,
      addressVerified: !!rawAddress
    });
    setOpen(false);
    setSearchQuery("");
  };

  const handleInviteSubmit = () => {
    if (inviteName.trim() && inviteEmail.trim() && onInviteNew) {
      triggerHapticFeedback('success');
      onInviteNew(inviteName.trim(), inviteEmail.trim());
      setInviteName("");
      setInviteEmail("");
      setShowInviteForm(false);
      setOpen(false);
    }
  };

  const resetInviteForm = () => {
    setShowInviteForm(false);
    setInviteName("");
    setInviteEmail("");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 min-h-[44px]"
        >
          {getDisplayLabel()}
          <ChevronsUpDown className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            open && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div ref={contentRef} className="mt-2 rounded-lg border bg-background shadow-sm">
          {/* Invite Form */}
          {showInviteForm ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Invite New Recipient</h3>
                <Button variant="ghost" size="sm" onClick={resetInviteForm} className="h-8 px-2">
                  Cancel
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-name" className="text-xs">Name</Label>
                  <Input
                    id="invite-name"
                    placeholder="Recipient's name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="text-xs">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="recipient@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
              </div>
              <Button
                onClick={handleInviteSubmit}
                disabled={!inviteName.trim() || !inviteEmail.trim()}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white"
              >
                Send Invitation
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                They'll receive an email to share their shipping address
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Connection list - natural height, parent modal scrolls */}
              <div className="divide-y">
                {/* Invite New Recipient Option - TOP of list for visibility */}
                {onInviteNew && (
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setShowInviteForm(true);
                      }}
                      className="w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px] touch-manipulation"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-sky-500">
                        <UserPlus className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Invite New Recipient</div>
                        <div className="text-xs text-muted-foreground">Send an invitation via email</div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Ship to Myself Option */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleSelectSelf}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px] touch-manipulation",
                      value?.type === 'self' && "bg-accent"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Ship to {userName}</div>
                      <div className="text-xs text-muted-foreground">Your own address</div>
                    </div>
                    {value?.type === 'self' && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </div>

                {/* Search input - positioned above Top Connections */}
                <div className="flex items-center border-b px-3 py-2 bg-background">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search connections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground"
                    autoComplete="off"
                  />
                  {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                </div>

                {/* Top Connections Section */}
                {displayConnections.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {searchQuery.trim().length >= 2 ? 'Matching Connections' : 'Your Top Connections'}
                    </div>
                    {displayConnections.map((connection) => {
                      const connectionId = connection.display_user_id || connection.connected_user_id;
                      const isSelected = value?.type === 'connection' && value?.connectionId === connectionId;
                      
                      return (
                        <button
                          key={connection.id}
                          type="button"
                          onClick={() => handleSelectConnection(connection)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px] touch-manipulation",
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
                            <div className="font-medium">
                              {connection.profile_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {connection.relationship_type || 'Connection'}
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                    
                    {/* Show hint when more connections exist */}
                    {hasMoreConnections && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        +{filteredConnections.length - 3} more • Search to find them
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Invitations Section */}
                {filteredPending.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending Invitations
                    </div>
                    {filteredPending.map((invitation) => {
                      const isSelected = value?.type === 'connection' && value?.connectionId === invitation.id;
                      
                      return (
                        <button
                          key={invitation.id}
                          type="button"
                          onClick={() => handleSelectConnection(invitation)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px] touch-manipulation",
                            isSelected && "bg-accent"
                          )}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {(invitation.profile_name || invitation.pending_recipient_name)?.substring(0, 2).toUpperCase() || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <div className="font-medium">
                              {invitation.profile_name || invitation.pending_recipient_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {invitation.pending_recipient_email || 'Invitation sent'}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Assign Later Option */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleSelectLater}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px] touch-manipulation",
                      value?.type === 'later' && "bg-accent"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Assign Later</div>
                      <div className="text-xs text-muted-foreground">Choose recipient in cart</div>
                    </div>
                    {value?.type === 'later' && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </div>

                {/* Empty state */}
                {filteredConnections.length === 0 && filteredPending.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No connections found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SimpleRecipientSelector;
