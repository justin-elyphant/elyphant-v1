
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Product } from "@/types/product";
import { useDirectMessaging } from "@/hooks/useUnifiedMessaging";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import ConnectionPickerModal from "./ConnectionPickerModal";
import MessageTemplateSelector from "./MessageTemplateSelector";
import { formatPrice } from "@/lib/utils";

interface ShareToConnectionButtonProps {
  product: Product;
  variant?: "icon" | "full";
  className?: string;
}

const ShareToConnectionButton = ({ 
  product, 
  variant = "icon", 
  className 
}: ShareToConnectionButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showConnectionPicker, setShowConnectionPicker] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<{ id: string; name: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("Thought you might like this!");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  // Get messaging functionality for the selected connection
  const connectionId = selectedConnection?.id || "";
  const { sendMessage } = useDirectMessaging(connectionId);

  const handleConnectionSelect = (connectionId: string, connectionName: string) => {
    setSelectedConnection({ id: connectionId, name: connectionName });
    setShowConnectionPicker(false);
    setShowMessageComposer(true);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConnection) return;

    setSending(true);
    
    const messageContent = selectedTemplate === 'custom' 
      ? customMessage 
      : selectedTemplate;

    try {
      // Use the messaging hook to send the message
      const result = await sendMessage({
        content: messageContent,
        messageType: 'product_share'
      });

      if (result) {
        toast.success(`Product shared with ${selectedConnection.name}!`);
        setShowMessageComposer(false);
        setSelectedConnection(null);
        setSelectedTemplate("Thought you might like this!");
        setCustomMessage("");
        
        // Option to view conversation
        setTimeout(() => {
          toast.success("Message sent!", {
            action: {
              label: "View Chat",
              onClick: () => navigate(`/messages?userId=${selectedConnection.id}`)
            }
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      toast.error("Failed to share product");
    } finally {
      setSending(false);
    }
  };

  const handleInitialClick = () => {
    if (!user) {
      toast.error("Please sign in to share products");
      return;
    }
    setShowConnectionPicker(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size={variant === "icon" ? "icon" : "sm"}
        className={className}
        onClick={handleInitialClick}
        aria-label="Share to connection"
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        {variant === "full" && "Share"}
      </Button>

      <ConnectionPickerModal
        open={showConnectionPicker}
        onOpenChange={setShowConnectionPicker}
        onSelectConnection={handleConnectionSelect}
      />

      <Dialog open={showMessageComposer} onOpenChange={setShowMessageComposer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share with {selectedConnection?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Product Preview */}
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                <img 
                  src={product.image} 
                  alt={product.title || product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {product.title || product.name}
                </h4>
                {product.brand && (
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                )}
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>

            <MessageTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
              customMessage={customMessage}
              onCustomMessageChange={setCustomMessage}
            />

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowMessageComposer(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={sending || (selectedTemplate === 'custom' && !customMessage.trim())}
                className="flex-1"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareToConnectionButton;
