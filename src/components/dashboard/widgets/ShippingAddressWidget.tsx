import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/contexts/profile/ProfileContext";

const ShippingAddressWidget = () => {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const address = profile?.shipping_address as any;
  const isVerified = (profile as any)?.address_verified;

  if (!address || !address.address_line1) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="text-sm font-medium mb-1">Shipping Address</h3>
              <p className="text-sm text-muted-foreground">No address on file</p>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <Link 
              to="/settings?tab=address" 
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Add shipping address
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-3">Shipping Address</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {profile?.name && <p>{profile.name}</p>}
            <p>{address.address_line1}</p>
            {address.address_line2 && <p>{address.address_line2}</p>}
            <p>
              {address.city}, {address.state} {address.zip_code}
              {address.country && `, ${address.country}`}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {isVerified && (
              <>
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary font-medium">Verified</span>
              </>
            )}
          </div>
        </div>
        <div className="pt-3 border-t border-border">
          <Link 
            to="/settings?tab=address" 
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Manage shipping addresses
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingAddressWidget;
