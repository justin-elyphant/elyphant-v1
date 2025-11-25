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
}

export const ConnectionPrivacyControls: React.FC<ConnectionPrivacyControlsProps> = ({ 
  connection, 
  onUpdate
}) => {
  console.log('🚀 [Privacy Controls] Component rendered with connection:', connection);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({
    shipping_address: true,
    dob: true,
    email: true,
    gift_preferences: true
  });

  React.useEffect(() => {
    fetchCurrentPermissions();
  }, [connection.id]);

  const fetchCurrentPermissions = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      // Get the connection record where current user is granting permissions to connected user
      // The connection.id is the target user ID, not the connection record ID
      const targetUserId = connection.id;
      
      const { data, error } = await supabase
        .from('user_connections')
        .select('data_access_permissions')
        .eq('user_id', currentUser.user.id)
        .eq('connected_user_id', targetUserId)
        .eq('status', 'accepted')
        .single();
      
      console.log('🔍 [Privacy Controls] Fetching permissions for:', {
        currentUserId: currentUser.user.id,
        targetUserId,
        connectionId: connection.id,
        connectionConnectionId: (connection as any).connectionId,
        foundData: data,
        error: error?.message
      });

      if (error) throw error;

      const currentPerms = (data?.data_access_permissions as any) || {};
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
    console.log('🚀 [Privacy Controls] Toggle clicked!', { field, allowed });
    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const newPermissions = {
        ...permissions,
        [field]: allowed
      };

      // Convert to the format expected by the database (true means granted, false means blocked, undefined means not set)
      const dbPermissions = {
        shipping_address: newPermissions.shipping_address ? true : false,
        dob: newPermissions.dob ? true : false,
        email: newPermissions.email ? true : false,
        gift_preferences: newPermissions.gift_preferences ? true : false
      };
      
      console.log('🔍 [Privacy Controls] Updating permissions:', {
        newPermissions,
        dbPermissions,
        currentUserId: currentUser.user.id,
        connectionId: connection.id
      });

      // Update the connection record where current user is granting permissions
      const targetUserId = connection.id;
      
      const { error } = await supabase
        .from('user_connections')
        .update({ 
          data_access_permissions: dbPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.user.id)
        .eq('connected_user_id', targetUserId);

      if (error) throw error;

      setPermissions(newPermissions);
      toast.success('Privacy settings updated');
      
      console.log('✅ [Privacy Controls] Successfully updated permissions');
      
      // Force a delay to ensure database is updated before refreshing
      setTimeout(() => {
        onUpdate();
      }, 500);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const hasAnyBlocks = !permissions.shipping_address || !permissions.dob || !permissions.email || !permissions.gift_preferences;

  return (
    <div className="space-y-4">
      {hasAnyBlocks && (
        <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">AI gifting is disabled due to blocked data</span>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          {hasAnyBlocks ? (
            <>
              <Shield className="h-4 w-4 text-warning" />
              Privacy Controls - Some Data Blocked
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-success" />
              Privacy Controls - All Data Shared
            </>
          )}
        </h4>
        <p className="text-sm text-muted-foreground">
          Control what information you're sharing with {connection.name} for gift-giving purposes.
          Blocking data will prevent them from accessing this information for AI gifting.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="shipping-toggle">My Shipping Address</Label>
              <p className="text-sm text-muted-foreground">Share your shipping address with {connection.name} for gift delivery</p>
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
              <Label htmlFor="birthday-toggle">My Birthday</Label>
              <p className="text-sm text-muted-foreground">Share your birthday with {connection.name} for occasion-based gifts</p>
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
              <Label htmlFor="email-toggle">My Email Address</Label>
              <p className="text-sm text-muted-foreground">Share your email with {connection.name} for gift notifications</p>
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
              <Label htmlFor="preferences-toggle">My Gift Preferences</Label>
              <p className="text-sm text-muted-foreground">Share your gift preferences and wishlist with {connection.name}</p>
            </div>
            <Switch
              id="preferences-toggle"
              checked={permissions.gift_preferences}
              onCheckedChange={(checked) => updatePermissions('gift_preferences', checked)}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};