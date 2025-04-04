
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Trash2 } from "lucide-react";
import DeleteAccountDialog from "./DeleteAccountDialog";

const DeleteAccount = () => {
  const { user } = useAuth();

  return (
    <div className="border-t pt-6 mt-8">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all of your data. This action cannot be undone.
        </p>
      </div>
      
      <DeleteAccountDialog>
        <Button 
          variant="destructive" 
          className="mt-4"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete My Account
        </Button>
      </DeleteAccountDialog>
    </div>
  );
};

export default DeleteAccount;
