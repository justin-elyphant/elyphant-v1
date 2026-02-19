import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileJson, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { exportUserData, downloadAsJson } from "@/utils/dataExportUtils";
import { supabase } from "@/integrations/supabase/client";

const DataExportSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be signed in to export your data.");
      return;
    }

    setLoading(true);
    try {
      const data = await exportUserData(user.id);
      downloadAsJson(data);
      setExported(true);
      toast.success("Your data has been downloaded.");
      // Reset success state after 5s
      setTimeout(() => setExported(false), 5000);
    } catch (err) {
      console.error("Data export failed:", err);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Download Your Data
        </CardTitle>
        <CardDescription>
          Export a copy of your personal data in JSON format — your profile, wishlists, orders,
          connections, and privacy preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Profile information and preferences</li>
          <li>Wishlists and wishlist items</li>
          <li>Order history</li>
          <li>Connections and relationships</li>
          <li>Email notification preferences</li>
          <li>Privacy and sharing settings</li>
          <li>Special dates and events</li>
        </ul>

        <Button
          onClick={handleExport}
          disabled={loading}
          variant={exported ? "outline" : "default"}
          className="gap-2"
        >
          {exported ? (
            <>
              <CheckCircle className="h-4 w-4 text-primary" />
              Downloaded
            </>
          ) : loading ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Preparing export…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download My Data
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Your data export will be prepared instantly and downloaded to your device. We do not
          store or log export requests.
        </p>
      </CardContent>
    </Card>
  );
};

export default DataExportSection;
