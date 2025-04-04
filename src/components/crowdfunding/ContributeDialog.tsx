
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { makeContribution } from '@/utils/crowdfundingService';

interface ContributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignTitle: string;
}

const ContributeDialog: React.FC<ContributeDialogProps> = ({ 
  open, 
  onOpenChange, 
  campaignId, 
  campaignTitle 
}) => {
  const [amount, setAmount] = useState<number>(20);
  const [message, setMessage] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (amount < 1) {
      setError("Contribution amount must be at least $1");
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await makeContribution(campaignId, amount, message, isAnonymous);
      
      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setError("Failed to process contribution");
      }
    } catch (err) {
      console.error("Error making contribution:", err);
      setError("An unexpected error occurred");
      toast.error("Failed to process contribution");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Quick amount options
  const amountOptions = [10, 25, 50, 100];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contribute to Campaign</DialogTitle>
          <DialogDescription>
            Support "{campaignTitle}" with your contribution
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <Label htmlFor="amount">Contribution Amount ($)</Label>
            <div className="grid grid-cols-4 gap-2">
              {amountOptions.map(option => (
                <Button
                  key={option}
                  type="button"
                  variant={amount === option ? "default" : "outline"}
                  onClick={() => setAmount(option)}
                >
                  ${option}
                </Button>
              ))}
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">$</span>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message with your contribution"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous">Make contribution anonymous</Label>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Continue to Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContributeDialog;
