
import React from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyVendorsStateProps {
  message?: string;
  icon?: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyVendorsState: React.FC<EmptyVendorsStateProps> = ({ 
  message = "Enter a search term to find vendors.",
  icon = <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />,
  actionButton
}) => {
  return (
    <div className="border rounded-md p-8 text-center">
      {icon}
      <p className="text-muted-foreground">{message}</p>
      {actionButton && (
        <Button className="mt-4" onClick={actionButton.onClick}>
          {actionButton.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyVendorsState;
