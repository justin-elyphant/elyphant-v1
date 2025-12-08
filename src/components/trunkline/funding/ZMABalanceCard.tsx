import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface ZMABalanceCardProps {
  balance: number;
  lastChecked?: string;
  status: 'sufficient' | 'low' | 'critical';
  isLoading?: boolean;
}

export function ZMABalanceCard({ balance, lastChecked, status, isLoading }: ZMABalanceCardProps) {
  const statusConfig = {
    sufficient: {
      icon: CheckCircle2,
      label: 'Sufficient',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    low: {
      icon: AlertTriangle,
      label: 'Low',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    critical: {
      icon: XCircle,
      label: 'Critical',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          ZMA Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isLoading ? 'opacity-50' : ''}`}>
          ${balance.toFixed(2)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </div>
        </div>
        {lastChecked && (
          <p className="text-xs text-muted-foreground mt-2">
            Last checked: {format(new Date(lastChecked), 'MMM d, h:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
