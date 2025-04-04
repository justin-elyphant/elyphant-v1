
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipientInfoForm } from "./recipient-info/RecipientInfoForm";
import { formSchema } from "./recipient-info/schema";
import { z } from "zod";

export type RecipientInfoFormData = z.infer<typeof formSchema>;

interface RecipientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RecipientInfoFormData) => void;
  productName: string;
}

const RecipientInfoDialog: React.FC<RecipientInfoDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  productName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gift Recipient Details</DialogTitle>
          <DialogDescription>
            Enter information about who will receive "{productName}". We'll notify them about their gift.
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
