
import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const DeleteProfileSection = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProfile = async () => {
    if (!user) {
      toast.error("You must be logged in to delete your profile");
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete the user's profile data first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }
      
      // Delete the user's account from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        throw authError;
      }

      // Sign out the user after deletion
      await signOut();
      
      toast.success("Your profile has been deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete your profile. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-t pt-6 mt-8">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all of your data. This action cannot be undone.
        </p>
      </div>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            className="mt-4"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete My Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProfile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteProfileSection;
