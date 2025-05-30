
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Trash2, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DeleteAccountDialog from "./DeleteAccountDialog";

const DeleteAccountSection: React.FC = () => {
  const [confirmText, setConfirmText] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const isDeleteEnabled = confirmText === "DELETE";

  const dataToDelete = [
    "Profile information and settings",
    "All wishlists and wishlist items", 
    "Connections and relationships",
    "Messages and conversations",
    "Search history",
    "Important dates and events",
    "Addresses and shipping information",
    "Privacy settings",
    "Auto-gifting rules and settings",
    "Gift searches and AI interactions",
    "Contributions and funding campaigns",
    "Blocked users list"
  ];

  return (
    <>
      <Separator className="my-8" />
      
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>This will permanently delete:</strong>
              <ul className="mt-2 ml-4 space-y-1">
                {dataToDelete.map((item, index) => (
                  <li key={index} className="text-sm list-disc">{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                To confirm deletion, type <span className="font-bold text-destructive">"DELETE"</span> below:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-1"
              />
            </div>

            <DeleteAccountDialog>
              <Button
                variant="destructive"
                disabled={!isDeleteEnabled}
                className="w-full"
                onClick={() => setShowDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account Permanently
              </Button>
            </DeleteAccountDialog>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Need help instead?</strong> Contact our support team if you're having issues with your account that don't require deletion.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DeleteAccountSection;
