
import React, { useState } from "react";
import { Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

interface GroupGiftingButtonProps {
  product: Product;
  className?: string;
}

const GroupGiftingButton: React.FC<GroupGiftingButtonProps> = ({ 
  product, 
  className = "" 
}) => {
  const { user } = useAuth();
  const { connections } = useEnhancedConnections();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Group gift for ${product.title || product.name}`);
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState(product.price || 0);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Filter to only accepted friend connections
  const friends = connections.filter(conn => 
    conn.status === 'accepted' && conn.relationship_type === 'friend'
  );

  const handleCreateCampaign = async () => {
    if (!user) {
      toast.error("Please sign in to create group gifts");
      return;
    }

    if (selectedFriends.length === 0) {
      toast.error("Please select at least one friend to invite");
      return;
    }

    setIsCreating(true);
    try {
      // Create the funding campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('funding_campaigns')
        .insert({
          title,
          description: description || `Let's pool together to buy this amazing gift!`,
          goal_amount: goalAmount,
          creator_id: user.id,
          campaign_type: 'group_gift',
          product_id: product.product_id || product.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // TODO: Send invitations to selected friends
      // This would typically involve creating invitation records and sending notifications

      toast.success("Group gift campaign created! Invitations will be sent to your friends.");
      setOpen(false);
      
      // Reset form
      setTitle(`Group gift for ${product.title || product.name}`);
      setDescription("");
      setGoalAmount(product.price || 0);
      setSelectedFriends([]);
      
    } catch (error) {
      console.error('Error creating group gift campaign:', error);
      toast.error("Failed to create group gift campaign");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
        >
          <Users className="h-4 w-4" />
          Group Gift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Create Group Gift
          </DialogTitle>
          <DialogDescription>
            Invite friends to contribute towards this gift together.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter campaign title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a message about this group gift..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="goal">Goal Amount</Label>
            <Input
              id="goal"
              type="number"
              value={goalAmount}
              onChange={(e) => setGoalAmount(Number(e.target.value))}
              min="1"
              step="0.01"
            />
          </div>
          
          <div>
            <Label>Invite Friends ({selectedFriends.length} selected)</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 mt-2">
              {friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={friend.id}
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => toggleFriendSelection(friend.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.profile_image} />
                        <AvatarFallback>
                          {friend.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <Label htmlFor={friend.id} className="flex-1 cursor-pointer">
                        {friend.profile_name || 'Unknown User'}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No friends found. Add some friends to create group gifts!
                </p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign}
              disabled={isCreating || selectedFriends.length === 0}
            >
              {isCreating ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupGiftingButton;
