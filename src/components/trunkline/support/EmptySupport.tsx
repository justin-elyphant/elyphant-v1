
import React from "react";
import { MessageSquare } from "lucide-react";

const EmptySupport: React.FC = () => {
  return (
    <div className="border rounded-md p-8 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">No support requests match your filters.</p>
    </div>
  );
};

export default EmptySupport;
