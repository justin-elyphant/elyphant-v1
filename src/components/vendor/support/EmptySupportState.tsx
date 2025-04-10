
import React from "react";
import { MessageSquare } from "lucide-react";

const EmptySupportState: React.FC = () => {
  return (
    <div className="border rounded-md p-8 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">
        No support requests found. When customers have questions about your products, they'll appear here.
      </p>
    </div>
  );
};

export default EmptySupportState;
