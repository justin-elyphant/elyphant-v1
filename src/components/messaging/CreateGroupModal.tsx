import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Connection {
  id: string;
  name: string;
  profile_image?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
  connections: Connection[];
}

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated, connections }: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [chatType, setChatType] = useState("general");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setGroupName("");
      setDescription("");
      setChatType("general");
      setSelectedMembers([]);
    }
  }, [isOpen]);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast("Please select at least one member");
      return;
    }

    setIsLoading(true);

    try {
      // Create the group chat using direct Supabase call
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: groupChat, error: chatError } = await supabase
        .from('group_chats')
        .insert({
          name: groupName.trim(),
          description: description.trim() || null,
          chat_type: chatType,
          creator_id: user.id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add creator as admin and members
      const members = [
        {
          group_chat_id: groupChat.id,
          user_id: user.id,
          role: 'admin',
          can_invite: true,
          can_manage_gifts: true
        },
        ...selectedMembers.filter(id => id !== user.id).map(user_id => ({
          group_chat_id: groupChat.id,
          user_id,
          role: 'member',
          can_invite: false,
          can_manage_gifts: false
        }))
      ];

      const { error: membersError } = await supabase
        .from('group_chat_members')
        .insert(members);

      if (membersError) throw membersError;

      toast("Group chat created successfully!");

      onGroupCreated(groupChat.id);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast("Failed to create group chat");
    } finally {
      setIsLoading(false);
    }
  };

  const getChatTypeOptions = () => [
    { value: 'general', label: 'General', description: 'Regular group chat' },
    { value: 'family', label: 'Family', description: 'Family conversations' },
    { value: 'occasion', label: 'Occasion', description: 'Event planning and coordination' },
    { value: 'gift_project', label: 'Gift Project', description: 'Collaborative gift planning' }
  ];

  const getSelectedConnection = (id: string) => {
    return connections.find(c => c.id === id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
          {/* Group Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional group description..."
                rows={2}
                disabled={isLoading}
              />
            </div>

            {/* Chat Type */}
            <div>
              <Label>Group Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {getChatTypeOptions().map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      chatType === option.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="chatType"
                      value={option.value}
                      checked={chatType === option.value}
                      onChange={(e) => setChatType(e.target.value)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="flex-1 flex flex-col min-h-0">
            <Label className="mb-2">
              Add Members ({selectedMembers.length} selected)
            </Label>
            
            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                {selectedMembers.map(memberId => {
                  const connection = getSelectedConnection(memberId);
                  if (!connection) return null;
                  
                  return (
                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={connection.profile_image} alt={connection.name} />
                        <AvatarFallback className="text-xs">
                          {connection.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{connection.name}</span>
                      <button
                        type="button"
                        onClick={() => handleMemberToggle(memberId)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Available Connections */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-1">
                {connections.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No connections available</p>
                    <p className="text-xs">Connect with friends to create groups</p>
                  </div>
                ) : (
                  connections.map(connection => (
                    <label
                      key={connection.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedMembers.includes(connection.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(connection.id)}
                        onCheckedChange={() => handleMemberToggle(connection.id)}
                        disabled={isLoading}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={connection.profile_image} alt={connection.name} />
                        <AvatarFallback className="text-sm">
                          {connection.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{connection.name}</span>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}
            >
              {isLoading ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;