
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDirectFollow } from "@/hooks/useDirectFollow";
import { UserX, Shield } from "lucide-react";

interface BlockButtonProps {
  targetUserId: string;
  targetName?: string;
}

const BlockButton: React.FC<BlockButtonProps> = ({ targetUserId, targetName = "this user" }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { followState, loading, blockUser, unblockUser } = useDirectFollow(targetUserId);

  const handleBlock = async () => {
    await blockUser(reason);
    setOpen(false);
    setReason("");
  };

  if (followState.isBlocked) {
    return (
      <Button
        onClick={unblockUser}
        disabled={loading}
        variant="outline"
        size="sm"
        className="text-green-600 hover:text-green-700"
      >
        <Shield className="h-4 w-4 mr-2" />
        Unblock
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
          <UserX className="h-4 w-4 mr-2" />
          Block
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Block {targetName}?</DialogTitle>
          <DialogDescription>
            When you block someone, they won't be able to follow you, send you messages, 
            or view your profile. You can unblock them at any time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you blocking this user?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBlock}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Blocking..." : "Block User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockButton;
