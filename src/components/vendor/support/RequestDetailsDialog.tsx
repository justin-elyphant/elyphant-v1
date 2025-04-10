
import React, { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, CheckCircle, XCircle } from "lucide-react";
import { VendorSupportRequest } from "./types";
import { formatDate } from "./utils";
import { toast } from "sonner";

interface RequestDetailsDialogProps {
  request: VendorSupportRequest | null;
}

const RequestDetailsDialog: React.FC<RequestDetailsDialogProps> = ({ request }) => {
  const [reply, setReply] = useState("");
  const [returnAction, setReturnAction] = useState("");
  const [returnReason, setReturnReason] = useState("");

  if (!request) return null;

  // Handle reply submission
  const handleSendReply = () => {
    if (!reply.trim() || !request) return;

    toast.success("Reply sent", {
      description: `Your response to support request #${request.id.slice(-6)} has been sent.`,
    });

    setReply("");
  };

  // Handle return authorization
  const handleReturnAuthorization = () => {
    if (!request) return;

    if (returnAction === "approve") {
      toast.success("Return approved", {
        description: "The customer will be notified that their return has been approved.",
      });
    } else if (returnAction === "deny") {
      if (!returnReason.trim()) {
        toast.error("Reason required", {
          description: "Please provide a reason for denying the return.",
        });
        return;
      }

      toast.success("Return denied", {
        description: "The customer will be notified that their return has been denied.",
      });
    }

    setReturnAction("");
    setReturnReason("");
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Support Request #{request.id.slice(-6)}</DialogTitle>
        <DialogDescription>
          {request.subject} - Order #{request.orderId.slice(-6)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div className="bg-muted p-4 rounded-md">
          <div className="text-xs text-muted-foreground mb-1">
            Most recent message from Elyphant Support ({formatDate(request.lastMessageDate)}):
          </div>
          <p className="text-sm">{request.lastMessage}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reply">Your Reply</Label>
          <Textarea
            id="reply"
            placeholder="Type your response here..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">Attachments (optional):</Label>
          <Button variant="outline" size="sm">
            <FileUp className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>

        {request.hasReturn && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Return Authorization</h4>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className={returnAction === "approve" ? "bg-green-50 border-green-200" : ""} 
                  onClick={() => setReturnAction("approve")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Return
                </Button>
                
                <Button 
                  variant="outline" 
                  className={returnAction === "deny" ? "bg-red-50 border-red-200" : ""} 
                  onClick={() => setReturnAction("deny")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny Return
                </Button>
              </div>
              
              {returnAction === "deny" && (
                <div className="space-y-2">
                  <Label htmlFor="return-reason">Reason for Denial (Required)</Label>
                  <Textarea
                    id="return-reason"
                    placeholder="Explain why the return is being denied..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
              
              {returnAction && (
                <Button 
                  onClick={handleReturnAuthorization}
                  disabled={returnAction === "deny" && !returnReason.trim()}
                >
                  Submit Return Decision
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSendReply} disabled={!reply.trim()}>
          Send Reply
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RequestDetailsDialog;
