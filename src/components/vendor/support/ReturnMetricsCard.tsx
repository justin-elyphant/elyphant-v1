
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ReturnMetricsCard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Return Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-3xl font-bold">2.7%</div>
            <Badge className="ml-2 bg-green-50 text-green-700 border-green-200">
              -0.5%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Below marketplace average of 3.2%
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Pending Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">4</div>
          <p className="text-xs text-muted-foreground mt-1">
            Action required on 2 returns
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Avg. Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">8.5h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: Under 12 hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnMetricsCard;
