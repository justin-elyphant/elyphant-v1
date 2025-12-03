import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, User, Users, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEnhancedConnections, EnhancedConnection } from "@/hooks/profile/useEnhancedConnections";
import { useIsMobile } from "@/hooks/use-mobile";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  };
  addressVerified?: boolean;
}

interface SimpleRecipientSelectorProps {
  value: SelectedRecipient | null;
  onChange: (recipient: SelectedRecipient) => void;
  userAddress?: any; // User's own shipping address from profile
  userName?: string;
}

export const SimpleRecipientSelector: React.FC<SimpleRecipientSelectorProps> = ({
  value,
  onChange,
  userAddress,
  userName = "Myself"
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  
  const { connections, pendingInvitations, loading } = useEnhancedConnections();
  
  // Filter accepted connections
  const acceptedConnections = useMemo(
    () => connections.filter(c => c.status === 'accepted'),
    [connections]
  );
  
  // Filter based on search
  const filteredConnections = useMemo(() => {
    if (searchQuery.length < 2) return acceptedConnections;
    return acceptedConnections.filter(c => 
      c.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.profile_username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [acceptedConnections, searchQuery]);
  
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
    onChange({
      type: 'later'
    });
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectConnection = (connection: EnhancedConnection) => {
    // For pending invitations, use pending_shipping_address
    const pendingAddress = connection.pending_shipping_address;
    const shippingAddress = pendingAddress ? {
      name: connection.profile_name || connection.pending_recipient_name || '',
      address: pendingAddress.address_line1 || pendingAddress.street || '',
      addressLine2: pendingAddress.address_line2 || '',
      city: pendingAddress.city || '',
      state: pendingAddress.state || '',
      zipCode: pendingAddress.zip_code || pendingAddress.zipCode || '',
      country: pendingAddress.country || 'US'
    } : undefined;

    onChange({
      type: 'connection',
      connectionId: connection.display_user_id || connection.connected_user_id || connection.id,
      connectionName: connection.profile_name || connection.pending_recipient_name || 'Recipient',
      shippingAddress,
      // Address verification status not available on EnhancedConnection, will be looked up at checkout
      addressVerified: undefined
    });
    setOpen(false);
    setSearchQuery("");
  };

  // Check if connection has address info
  const hasAddress = (connection: EnhancedConnection) => {
    return !!connection.pending_shipping_address;
  };

  // Shared content
  const SelectorContent = () => (
    <>
      {/* Search input */}
      <div className="flex items-center border-b px-3 py-2">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          type="text"
          placeholder="Search connections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          autoComplete="off"
          autoFocus
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {/* Ship to Myself Option */}
        <div className="p-2">
          <button
            type="button"
            onClick={handleSelectSelf}
            className={cn(
              "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px]",
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

        <Separator />

        {/* Connections Section */}
        {filteredConnections.length > 0 && (
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Your Connections
            </div>
            {filteredConnections.map((connection) => {
              const connectionId = connection.display_user_id || connection.connected_user_id;
              const isSelected = value?.type === 'connection' && value?.connectionId === connectionId;
              
              return (
                <button
                  key={connection.id}
                  type="button"
                  onClick={() => handleSelectConnection(connection)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px]",
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
          </div>
        )}

        {/* Pending Invitations Section */}
        {filteredPending.length > 0 && (
          <>
            <Separator />
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
                      "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px]",
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
          </>
        )}

        <Separator />

        {/* Assign Later Option */}
        <div className="p-2">
          <button
            type="button"
            onClick={handleSelectLater}
            className={cn(
              "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent cursor-pointer min-h-[44px]",
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
    </>
  );

  // Mobile: use Drawer, Desktop: use Popover
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11"
          >
            {getDisplayLabel()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh] backdrop-blur-xl pb-safe">
          <VisuallyHidden>
            <DrawerTitle>Select Recipient</DrawerTitle>
          </VisuallyHidden>
          <SelectorContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11"
        >
          {getDisplayLabel()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <SelectorContent />
      </PopoverContent>
    </Popover>
  );
};

export default SimpleRecipientSelector;
