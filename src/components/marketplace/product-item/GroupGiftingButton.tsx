
import React, { useState } from "react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useConnections } from "@/hooks/useConnections";
import { Product } from "@/types/product";
import { useAuth } from "@/contexts/auth";

interface GroupGiftingButtonProps {
  product: Product;
  variant?: "icon" | "full";
  className?: string;
}

const GroupGiftingButton = ({ 
  product, 
  variant = "icon", 
  className 
}: GroupGiftingButtonProps) => {
  const { user } = useAuth();
  const { friends } = useConnections();
  const [open, setOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [contributionAmount, setContributionAmount] = useState<number>(
    product.price ? Math.ceil(product.price / 2) : 0
  );
  const [message, setMessage] = useState("");

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const calculateSplitAmount = () => {
    if (!product.price) return 0;
    const totalPeople = selectedFriends.length + 1; // +1 for the current user
    return totalPeople > 1 ? Math.ceil(product.price / totalPeople) : product.price;
  };

  const handleCreateGroupGift = () => {
    if (selectedFriends.length === 0) {
      toast.error("Please select at least one friend to create a group gift");
      return;
    }

    // Here you would integrate with your backend to create the group gift
    // For now, we'll show a success toast
    toast.success("Group gift invitation sent!", {
      description: `Invited ${selectedFriends.length} friends to contribute to this gift`
    });
    
    setOpen(false);
    setSelectedFriends([]);
    setMessage("");
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={variant === "icon" ? "icon" : "sm"}
          className={className}
          aria-label="Set up group gift"
        >
          <Users className="h-4 w-4 mr-1" />
          {variant === "full" && "Group Gift"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Group Gift</DialogTitle>
          <DialogDescription>
            Invite friends to contribute to {product.title || product.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="flex items-center space-x-2">
            <img 
              src={product.image} 
              alt={product.title || product.name || ""} 
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <p className="font-medium">{product.title || product.name}</p>
              <p className="text-sm text-muted-foreground">${product.price?.toFixed(2)}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Your contribution</label>
            <div className="flex items-center space-x-2 mt-1">
              <span>$</span>
              <Input 
                type="number" 
                value={contributionAmount}
                onChange={e => setContributionAmount(Number(e.target.value))}
                min={1}
                max={product.price || 1000}
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Invite friends (Select)</label>
            <div className="max-h-48 overflow-y-auto mt-2 border rounded-md">
              {friends.length > 0 ? (
                <ul className="divide-y">
                  {friends.map(friend => (
                    <li 
                      key={friend.id} 
                      onClick={() => handleFriendToggle(friend.id)}
                      className={`p-2 flex items-center space-x-2 cursor-pointer transition-colors ${
                        selectedFriends.includes(friend.id) ? 'bg-slate-100' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedFriends.includes(friend.id)} 
                        onChange={() => {}} // Handled by li onClick
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.imageUrl} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{friend.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  You need to add friends to invite them to group gifts
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Add a message</label>
            <Input
              className="mt-1"
              placeholder="Let's get this gift for Sarah's birthday!"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          
          {selectedFriends.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-md">
              <p className="text-sm font-medium">Split Summary</p>
              <p className="text-sm">Each person pays: <span className="font-medium">${calculateSplitAmount().toFixed(2)}</span></p>
              <p className="text-sm">Total people: {selectedFriends.length + 1}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGroupGift}>Create Group Gift</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupGiftingButton;
