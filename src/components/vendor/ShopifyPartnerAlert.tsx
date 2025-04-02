
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface ShopifyPartnerAlertProps {
  onShowInfo: () => void;
}

const ShopifyPartnerAlert = ({ onShowInfo }: ShopifyPartnerAlertProps) => {
  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertTitle>Shopify Development Store Options</AlertTitle>
      <AlertDescription>
        No Shopify store yet? Use "development" as the store URL to test, or create a real development store through your Shopify Partners account.{" "}
        <Button variant="link" className="p-0 h-auto" onClick={onShowInfo}>
          Learn more
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ShopifyPartnerAlert;
