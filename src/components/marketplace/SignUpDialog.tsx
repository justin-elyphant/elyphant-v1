
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SignUpDialog = ({ open, onOpenChange }: SignUpDialogProps) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate("/sign-up");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            Create Your Wishlist
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Sign up to start saving your favorite products to your wishlist!
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-6">
          <div className="text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-muted-foreground mb-4">
              Save products, share with friends, and get notified about price drops.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not Now
          </Button>
          <Button onClick={handleSignUp}>
            Sign Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpDialog;
