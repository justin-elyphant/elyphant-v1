import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, User, Mail } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { GiftSetupData } from "../GiftSetupWizard";

interface WizardStepOneProps {
  data: GiftSetupData;
  onNext: (stepData: Partial<GiftSetupData>) => void;
}

const RELATIONSHIP_TYPES = [
  { value: "spouse", label: "Spouse/Partner" },
  { value: "family", label: "Family Member" },
  { value: "friend", label: "Friend" },
  { value: "close_friend", label: "Close Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "acquaintance", label: "Acquaintance" }
];

export const WizardStepOne = forwardRef<any, WizardStepOneProps>(({ data, onNext }, ref) => {
  const [formData, setFormData] = useState({
    recipientName: data.recipientName || "",
    recipientEmail: data.recipientEmail || "",
    relationshipType: data.relationshipType || "friend",
    shippingAddress: data.shippingAddress || null,
    apartmentUnit: data.shippingAddress?.line2 || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Expose getCurrentData method to parent
  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      ...formData,
      shippingAddress: formData.shippingAddress ? {
        ...formData.shippingAddress,
        line2: formData.apartmentUnit
      } : null
    })
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Recipient name is required";
    }

    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = "Please enter a valid email address";
    }

    if (!formData.relationshipType) {
      newErrors.relationshipType = "Please select your relationship";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Ensure apartment/unit is included in the shipping address
      const updatedData = {
        ...formData,
        shippingAddress: formData.shippingAddress ? {
          ...formData.shippingAddress,
          line2: formData.apartmentUnit
        } : null
      };
      onNext(updatedData);
    }
  };

  const handleAddressSelect = (address: any) => {
    setFormData(prev => ({ 
      ...prev, 
      shippingAddress: {
        ...address,
        line2: prev.apartmentUnit // Preserve apartment/unit when selecting new address
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Who are you setting up gifts for?
          </CardTitle>
          <CardDescription>
            Tell us about the person you'd like to send gifts to. We'll invite them to join the platform so they can connect with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <Input
                id="recipientName"
                placeholder="e.g., Sarah Johnson"
                value={formData.recipientName}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                className={errors.recipientName ? "border-destructive" : ""}
              />
              {errors.recipientName && (
                <p className="text-sm text-destructive">{errors.recipientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email Address *</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="e.g., sarah@example.com"
                value={formData.recipientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                className={errors.recipientEmail ? "border-destructive" : ""}
              />
              {errors.recipientEmail && (
                <p className="text-sm text-destructive">{errors.recipientEmail}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationshipType">Your Relationship *</Label>
            <Select
              value={formData.relationshipType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationshipType: value }))}
            >
              <SelectTrigger className={errors.relationshipType ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.relationshipType && (
              <p className="text-sm text-destructive">{errors.relationshipType}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address (Optional)
          </CardTitle>
          <CardDescription>
            Add their shipping address now to make gift delivery seamless. You can always add or update this later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <GooglePlacesAutocomplete
              value={formData.shippingAddress?.formatted_address || ""}
              onChange={(value) => {
                // Handle typing in the input field
                if (!value) {
                  setFormData(prev => ({ ...prev, shippingAddress: null }));
                }
              }}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing their address..."
              className="w-full"
            />
            
            <div className="space-y-2">
              <Label htmlFor="apartmentUnit">Apartment, Unit, Suite (Optional)</Label>
              <Input
                id="apartmentUnit"
                placeholder="e.g., Apt 4B, Suite 200, Unit 15"
                value={formData.apartmentUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, apartmentUnit: e.target.value }))}
              />
            </div>
          </div>
          
          {formData.shippingAddress && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Address saved:</p>
              <p className="text-sm text-green-700">
                {formData.shippingAddress.formatted_address}
                {formData.apartmentUnit && (
                  <><br />{formData.apartmentUnit}</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg" className="min-w-32">
          Next: When
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
});