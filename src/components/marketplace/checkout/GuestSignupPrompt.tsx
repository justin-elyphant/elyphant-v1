
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, X, CheckCircle, Package, Heart } from "lucide-react";
import { ShippingInfo } from "./useCheckoutState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GuestSignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  shippingInfo: ShippingInfo;
  orderNumber: string;
}

const GuestSignupPrompt: React.FC<GuestSignupPromptProps> = ({
  isOpen,
  onClose,
  shippingInfo,
  orderNumber
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: shippingInfo.email,
        password: password,
        options: {
          data: {
            name: shippingInfo.name,
            shipping_address: {
              address: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              zipCode: shippingInfo.zipCode,
              country: shippingInfo.country
            }
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created successfully! Check your email to verify your account.");
      onClose();
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Save Your Information
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Order #{orderNumber} Confirmed!</span>
            </div>
            <p className="text-sm text-green-700">
              Create an account to track your order and enjoy faster checkout next time.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Benefits of creating an account:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Track your orders and delivery status</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Create wishlists and save favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Faster checkout with saved information</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={shippingInfo.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={setAgreeToTerms}
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSignup} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestSignupPrompt;
