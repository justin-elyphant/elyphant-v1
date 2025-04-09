
import React from "react";
import { Activity } from "lucide-react";

const ActivityTabContent = () => {
  return (
    <div className="text-center py-8 border rounded-lg">
      <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
      <h4 className="font-medium">No recent activity</h4>
      <p className="text-sm text-muted-foreground mt-1">
        Recent activity will appear here.
      </p>
    </div>
  );
};

export default ActivityTabContent;
