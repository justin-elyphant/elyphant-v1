
import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  children: React.ReactNode;
}

const DeleteAccountDialog = ({ children }: DeleteAccountDialogProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("You must be logged in to delete your account");
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log("Starting account deletion process for user:", user.id);
      
      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account", {
          description: error.message || "Please try again or contact support"
        });
        return;
      }

      console.log("Account deletion successful:", data);
      
      // Show success message
      toast.success("Account deleted successfully", {
        description: "Your account and all data have been permanently removed"
      });

      // Sign out and redirect to home
      await signOut();
      navigate("/");
      
    } catch (error) {
      console.error("Unexpected error during account deletion:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers including:</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Your profile and personal information</li>
              <li>All wishlists and saved items</li>
              <li>Connections and relationships</li>
              <li>Messages and conversation history</li>
              <li>Search history and preferences</li>
            </ul>
            <p className="font-medium text-destructive mt-3">This action is irreversible.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteAccount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, delete my account permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
