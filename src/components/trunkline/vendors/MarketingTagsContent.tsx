
import React from "react";
import { Tag } from "lucide-react";
import EmptyVendorsState from "./EmptyVendorsState";

const MarketingTagsContent: React.FC = () => {
  const handleCreateTag = () => {
    console.log("Create tag button clicked");
    // Handle tag creation logic
  };

  return (
    <EmptyVendorsState 
      icon={<Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
      message="No marketing tags configured. Tags allow you to segment vendors for campaigns."
      actionButton={{
        label: "Create Tag",
        onClick: handleCreateTag
      }}
    />
  );
};

export default MarketingTagsContent;
