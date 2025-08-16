import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Connection } from "@/types/connections";

interface ConnectionPrivacyControlsProps {
  connection: Connection;
  onUpdate: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionPrivacyControls: React.FC<ConnectionPrivacyControlsProps> = ({ 
  connection, 
  onUpdate, 
  isOpen, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    shipping_address: true,
    dob: true,
    email: true,
    gift_preferences: true
  });

  React.useEffect(() => {
    fetchCurrentPermissions();
  }, [connection.id, isOpen]);

  const fetchCurrentPermissions = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data, error } = await supabase
        .from('user_connections')
        .select('data_access_permissions')
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${connection.id}),and(user_id.eq.${connection.id},connected_user_id.eq.${currentUser.user.id})`)
        .single();

      if (error) throw error;

      const currentPerms = data?.data_access_permissions || {};
      setPermissions({
        shipping_address: currentPerms.shipping_address !== false,
        dob: currentPerms.dob !== false,
        email: currentPerms.email !== false,
        gift_preferences: currentPerms.gift_preferences !== false
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const updatePermissions = async (field: string, allowed: boolean) => {
    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const newPermissions = {
        ...permissions,
        [field]: allowed
      };

      // Convert to the format expected by the database (false means blocked)
      const dbPermissions = {
        shipping_address: newPermissions.shipping_address ? undefined : false,
        dob: newPermissions.dob ? undefined : false,
        email: newPermissions.email ? undefined : false,
        gift_preferences: newPermissions.gift_preferences ? undefined : false
      };

      const { error } = await supabase
        .from('user_connections')
        .update({ 
          data_access_permissions: dbPermissions,
          updated_at: new Date().toISOString()
        })
        .or(`and(user_id.eq.${currentUser.user.id},connected_user_id.eq.${connection.id}),and(user_id.eq.${connection.id},connected_user_id.eq.${currentUser.user.id})`);

      if (error) throw error;

      setPermissions(newPermissions);
      toast.success('Privacy settings updated');
      onUpdate();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasAnyBlocks = !permissions.shipping_address || !permissions.dob || !permissions.email || !permissions.gift_preferences;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasAnyBlocks ? (
            <>
              <Shield className="h-5 w-5 text-warning" />
              Privacy Controls - Some Data Blocked
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 text-success" />
              Privacy Controls - All Data Shared
            </>
          )}
        </CardTitle>
        <CardDescription>
          Control what information {connection.name} can access for gift-giving purposes.
          Blocking data will prevent automatic gift suggestions and purchases.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAnyBlocks && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Auto-gifting is disabled due to blocked data</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="shipping-toggle">Shipping Address</Label>
              <p className="text-sm text-muted-foreground">Allow access to your shipping address for gift delivery</p>
            </div>
            <Switch
              id="shipping-toggle"
              checked={permissions.shipping_address}
              onCheckedChange={(checked) => updatePermissions('shipping_address', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="birthday-toggle">Birthday</Label>
              <p className="text-sm text-muted-foreground">Allow access to your birthday for occasion-based gifts</p>
            </div>
            <Switch
              id="birthday-toggle"
              checked={permissions.dob}
              onCheckedChange={(checked) => updatePermissions('dob', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-toggle">Email Address</Label>
              <p className="text-sm text-muted-foreground">Allow access to your email for gift notifications</p>
            </div>
            <Switch
              id="email-toggle"
              checked={permissions.email}
              onCheckedChange={(checked) => updatePermissions('email', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="preferences-toggle">Gift Preferences</Label>
              <p className="text-sm text-muted-foreground">Allow access to your gift preferences and wishlist</p>
            </div>
            <Switch
              id="preferences-toggle"
              checked={permissions.gift_preferences}
              onCheckedChange={(checked) => updatePermissions('gift_preferences', checked)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};