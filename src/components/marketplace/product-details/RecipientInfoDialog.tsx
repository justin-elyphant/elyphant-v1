
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RecipientInfoForm } from './recipient-info/RecipientInfoForm';

interface RecipientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  productName: string;
}

const RecipientInfoDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  productName 
}: RecipientInfoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="sticky top-0 z-10 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur border-b pt-2 pb-3">
          <DialogTitle>Gift Recipient Information</DialogTitle>
          <DialogDescription>
            Please provide details about who this gift is for. We'll notify them about their gift.
          </DialogDescription>
        </DialogHeader>
        
        <RecipientInfoForm 
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          productName={productName}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RecipientInfoDialog;
