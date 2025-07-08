import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddNewAddressForm from './AddNewAddressForm';

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressAdded: (address: any) => void;
  defaultName?: string;
  title?: string;
}

const AddressFormDialog: React.FC<AddressFormDialogProps> = ({
  open,
  onOpenChange,
  onAddressAdded,
  defaultName = '',
  title = 'Add New Address'
}) => {
  const handleAddressAdded = (address: any) => {
    onAddressAdded(address);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sr-only">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        </div>
        <AddNewAddressForm
          onAddressAdded={handleAddressAdded}
          onCancel={handleCancel}
          defaultName={defaultName}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddressFormDialog;