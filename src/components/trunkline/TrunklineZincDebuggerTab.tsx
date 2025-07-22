
import React from 'react';
import ZincOrderDebugger from '@/components/admin/ZincOrderDebugger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TrunklineZincDebuggerTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Zinc Order Debugger</h1>
        <p className="text-slate-600 mt-1">
          Troubleshoot and debug Zinc order processing issues
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Tools</CardTitle>
          <CardDescription>
            Use these tools to troubleshoot Zinc order processing issues. Check order status, 
            view detailed logs, and manually verify orders that may be stuck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ZincOrderDebugger />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineZincDebuggerTab;
