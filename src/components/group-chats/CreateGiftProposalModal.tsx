import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Gift, Calendar } from "lucide-react";
import { createGiftProposal } from "@/services/groupChatService";
import { useToast } from "@/hooks/use-toast";

interface CreateGiftProposalModalProps {
  groupChatId: string;
  onProposalCreated?: () => void;
  children?: React.ReactNode;
}

const CreateGiftProposalModal = ({ groupChatId, onProposalCreated, children }: CreateGiftProposalModalProps) => {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    product_price: '',
    product_image: '',
    description: '',
    deadline: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.product_price) {
      toast("Please fill in required fields");
      return;
    }

    setIsCreating(true);
    try {
      const proposalData = {
        product_id: formData.product_id || `manual-${Date.now()}`,
        product_name: formData.product_name,
        product_price: parseFloat(formData.product_price),
        product_image: formData.product_image || undefined,
        description: formData.description || undefined,
        deadline: formData.deadline || undefined
      };

      const proposal = await createGiftProposal(groupChatId, proposalData);
      
      if (proposal) {
        toast("Gift proposal created successfully!");
        setOpen(false);
        setFormData({
          product_id: '',
          product_name: '',
          product_price: '',
          product_image: '',
          description: '',
          deadline: ''
        });
        onProposalCreated?.();
      } else {
        throw new Error('Failed to create proposal');
      }
    } catch (error) {
      console.error('Error creating gift proposal:', error);
      toast("Failed to create gift proposal");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Gift className="h-4 w-4 mr-2" />
            Propose Gift
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Create Gift Proposal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_price">Price *</Label>
            <Input
              id="product_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.product_price}
              onChange={(e) => setFormData(prev => ({ ...prev, product_price: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_image">Product Image URL</Label>
            <Input
              id="product_image"
              type="url"
              value={formData.product_image}
              onChange={(e) => setFormData(prev => ({ ...prev, product_image: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Why is this a great gift choice?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Voting Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGiftProposalModal;