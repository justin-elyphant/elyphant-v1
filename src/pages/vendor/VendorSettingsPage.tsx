import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Building2, Truck, Bell } from "lucide-react";
import { useVendorAccount } from "@/hooks/vendor/useVendorAccount";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VendorSettingsPage: React.FC = () => {
  const { data: account, isLoading, refetch } = useVendorAccount();
  const [saving, setSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // Shipping
  const [shippingFlatRate, setShippingFlatRate] = useState("0");
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("0");

  // Notifications
  const [emailOrders, setEmailOrders] = useState(true);
  const [emailReturns, setEmailReturns] = useState(true);

  useEffect(() => {
    if (account) {
      setCompanyName(account.company_name ?? "");
      setContactEmail(account.contact_email ?? "");
      setPhone((account as any).phone ?? "");
      setWebsite((account as any).website ?? "");
      setDescription((account as any).description ?? "");
      setShippingFlatRate(String((account as any).shipping_flat_rate ?? 0));
      setFreeShippingEnabled((account as any).free_shipping_enabled ?? false);
      setFreeShippingThreshold(String((account as any).free_shipping_threshold ?? 0));
      const notifs = (account as any).notification_preferences;
      if (notifs) {
        setEmailOrders(notifs.email_orders ?? true);
        setEmailReturns(notifs.email_returns ?? true);
      }
    }
  }, [account]);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("vendor_accounts")
        .update({
          company_name: companyName,
          contact_email: contactEmail,
          phone,
          website,
          description,
          shipping_flat_rate: parseFloat(shippingFlatRate) || 0,
          free_shipping_enabled: freeShippingEnabled,
          free_shipping_threshold: parseFloat(freeShippingThreshold) || 0,
          notification_preferences: {
            email_orders: emailOrders,
            email_returns: emailReturns,
          },
        } as any)
        .eq("id", account.id);

      if (error) throw error;
      toast.success("Settings saved successfully");
      refetch();
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your vendor account, shipping, and notifications.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" strokeWidth={1.5} />}
          Save Changes
        </Button>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Account Information
          </CardTitle>
          <CardDescription>Your business details visible on the marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your business..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Truck className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Shipping Configuration
          </CardTitle>
          <CardDescription>Set shipping rates for your products.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flatRate">Flat Rate Shipping ($)</Label>
            <Input
              id="flatRate"
              type="number"
              min="0"
              step="0.01"
              value={shippingFlatRate}
              onChange={(e) => setShippingFlatRate(e.target.value)}
              className="max-w-[200px]"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Free Shipping</p>
              <p className="text-xs text-muted-foreground">Offer free shipping above a minimum order amount.</p>
            </div>
            <Switch checked={freeShippingEnabled} onCheckedChange={setFreeShippingEnabled} />
          </div>
          {freeShippingEnabled && (
            <div className="space-y-2">
              <Label htmlFor="freeThreshold">Free Shipping Threshold ($)</Label>
              <Input
                id="freeThreshold"
                type="number"
                min="0"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">New Order Notifications</p>
              <p className="text-xs text-muted-foreground">Get emailed when a customer orders your product.</p>
            </div>
            <Switch checked={emailOrders} onCheckedChange={setEmailOrders} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Return & Refund Notifications</p>
              <p className="text-xs text-muted-foreground">Get emailed when a return request is filed.</p>
            </div>
            <Switch checked={emailReturns} onCheckedChange={setEmailReturns} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSettingsPage;
