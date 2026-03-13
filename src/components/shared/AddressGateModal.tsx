import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";

interface AddressGateModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
  description?: string;
}

const AddressGateModal: React.FC<AddressGateModalProps> = ({
  open,
  onClose,
  onComplete,
  title = "Add your shipping address",
  description = "Add your address so friends can send you gifts.",
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    line2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });

  const handleAddressSelect = (selected: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    setAddress((prev) => ({
      ...prev,
      street: selected.address,
      city: selected.city,
      state: selected.state,
      zipCode: selected.zipCode,
      country: selected.country || "US",
    }));
  };

  const isValid = address.street && address.city && address.state && address.zipCode;

  const handleSave = async () => {
    if (!user || !isValid) return;

    setSaving(true);
    try {
      const shippingAddress = {
        street: address.street,
        line2: address.line2 || "",
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        formatted_address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`,
      };

      const { error } = await supabase
        .from("profiles")
        .update({ shipping_address: shippingAddress })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Address saved!");
      onComplete();
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error("Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <AddressAutocomplete
            value={address.street}
            onChange={(v) => setAddress((prev) => ({ ...prev, street: v }))}
            onAddressSelect={handleAddressSelect}
          />

          <div>
            <Label htmlFor="gate-line2">Apartment, suite, etc. (optional)</Label>
            <Input
              id="gate-line2"
              placeholder="Apt, suite, unit..."
              value={address.line2}
              onChange={(e) => setAddress((prev) => ({ ...prev, line2: e.target.value }))}
              className="min-h-[44px] mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gate-city">City</Label>
              <Input
                id="gate-city"
                placeholder="San Francisco"
                value={address.city}
                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                className="min-h-[44px] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gate-state">State</Label>
              <Input
                id="gate-state"
                placeholder="California"
                value={address.state}
                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                className="min-h-[44px] mt-1"
              />
            </div>
          </div>

          <div className="w-1/2">
            <Label htmlFor="gate-zip">ZIP Code</Label>
            <Input
              id="gate-zip"
              placeholder="94103"
              value={address.zipCode}
              onChange={(e) => setAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
              className="min-h-[44px] mt-1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 min-h-[44px]">
              Skip for now
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex-1 min-h-[44px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Address"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddressGateModal;
