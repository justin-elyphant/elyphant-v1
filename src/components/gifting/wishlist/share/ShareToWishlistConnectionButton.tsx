import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Search, Users, Send, Heart, ArrowLeft } from "lucide-react";
import { Wishlist } from "@/types/profile";
import { useConnections } from "@/hooks/profile/useConnections";
import { useDirectMessaging } from "@/hooks/useUnifiedMessaging";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ShareToWishlistConnectionButtonProps {
  wishlist: Wishlist;
  onShareComplete?: () => void;
}

const ShareToWishlistConnectionButton = ({
  wishlist,
  onShareComplete,
}: ShareToWishlistConnectionButtonProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<{ id: string; name: string } | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { connections, loading: connectionsLoading } = useConnections();
  
  // Get messaging functionality for the selected connection
  const connectionId = selectedConnection?.id || "";
  const { sendMessage } = useDirectMessaging(connectionId);

  const shareUrl = `${window.location.origin}/wishlist/${wishlist.id}`;
  const itemCount = wishlist.items?.length || 0;
  const totalValue = wishlist.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

  const filteredConnections = connections.filter((conn) =>
    conn.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenChange = (isOpen: boolean) => {
    triggerHapticFeedback('light');
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedConnection(null);
      setMessage("");
      setSearchTerm("");
    }
  };

  const handleSelectConnection = (connectionId: string, connectionName: string) => {
    triggerHapticFeedback('light');
    setSelectedConnection({ id: connectionId, name: connectionName });
    setMessage(`Check out my wishlist "${wishlist.title}"! 🎁`);
  };

  const handleBack = () => {
    triggerHapticFeedback('light');
    setSelectedConnection(null);
    setMessage("");
  };

  const handleSend = async () => {
    if (!selectedConnection || !sendMessage) return;
    
    triggerHapticFeedback('medium');
    setSending(true);

    try {
      const fullMessage = `${message}\n\n📋 ${wishlist.title}\n${itemCount} items • $${totalValue.toFixed(2)}\n\n${shareUrl}`;
      
      await sendMessage({
        content: fullMessage,
        messageType: 'product_share',
        wishlistLinkId: wishlist.id,
      });

      toast.success("Wishlist shared!");
      setOpen(false);
      onShareComplete?.();
    } catch (error) {
      console.error('Failed to share wishlist:', error);
      toast.error("Failed to share. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start gap-3 h-12 text-left"
        onClick={() => handleOpenChange(true)}
      >
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Send to Connection</p>
          <p className="text-xs text-muted-foreground">Share via Elyphant messaging</p>
        </div>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </Button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)] max-h-[85vh]">
          <DrawerHeader className="text-center pb-2 relative">
            {selectedConnection && (
              <button
                onClick={handleBack}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 -ml-2 touch-manipulation"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <DrawerTitle className="text-lg font-semibold">
              {selectedConnection ? "Add a Message" : "Choose a Friend"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <AnimatePresence mode="wait">
              {!selectedConnection ? (
                <motion.div
                  key="connection-picker"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search connections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  {/* Connection List */}
                  <div className="max-h-[40vh] overflow-y-auto space-y-1">
                    {connectionsLoading ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Loading connections...
                      </div>
                    ) : filteredConnections.length > 0 ? (
                      filteredConnections.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => handleSelectConnection(
                            connection.id, 
                            connection.display_name || connection.username || "Friend"
                          )}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl",
                            "hover:bg-muted/50 active:bg-muted transition-colors",
                            "touch-manipulation text-left"
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={connection.avatar_url || ""} />
                            <AvatarFallback>
                              {connection.display_name?.[0] || connection.username?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {connection.display_name || connection.username}
                            </p>
                            {connection.username && connection.display_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                @{connection.username}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        {searchTerm ? "No connections found" : "No connections yet"}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="message-composer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Selected Connection */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {selectedConnection.name}
                      </p>
                    </div>
                  </div>

                  {/* Wishlist Preview */}
                  <div className="flex items-center gap-3 p-3 border rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{wishlist.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {itemCount} items • ${totalValue.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Add a message (optional)
                    </label>
                    <Input
                      placeholder="Say something..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  {/* Send Button */}
                  <Button
                    className="w-full h-12 gap-2"
                    onClick={handleSend}
                    disabled={sending}
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Wishlist"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ShareToWishlistConnectionButton;
