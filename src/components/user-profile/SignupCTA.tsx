
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Heart, Gift } from "lucide-react";
import { Link } from "react-router-dom";

interface SignupCTAProps {
  profileName: string;
  onDismiss: () => void;
}

const SignupCTA = ({ profileName, onDismiss }: SignupCTAProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Check if we've already shown this CTA in this session
    const hasShownCTA = sessionStorage.getItem('elyphant-signup-cta-shown');
    if (hasShownCTA) {
      return;
    }

    let hasScrolled = false;
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (!hasScrolled && window.scrollY > 200) {
        hasScrolled = true;
        
        // Show CTA after 10 seconds of scrolling
        timeoutId = setTimeout(() => {
          setOpen(true);
          sessionStorage.setItem('elyphant-signup-cta-shown', 'true');
        }, 10000);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    onDismiss();
  };

  const handleQuickSignup = () => {
    // Store the email for pre-filling on signup page
    if (email) {
      sessionStorage.setItem('elyphant-signup-email', email);
    }
    window.location.href = '/signup';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Want to create your own wishlist like {profileName}?
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Join Elyphant and never miss the perfect gift again!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleQuickSignup}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Heart className="h-4 w-4 mr-2" />
            Start My Wishlist
          </Button>
          
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Continue browsing
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/signin" className="text-purple-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupCTA;
