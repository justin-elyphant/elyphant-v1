import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TransferCalculatorProps {
  pendingOrdersValue: number;
  bufferAmount: number;
  currentBalance: number;
  recommendedTransfer: number;
}

export function TransferCalculator({
  pendingOrdersValue,
  bufferAmount,
  currentBalance,
  recommendedTransfer,
}: TransferCalculatorProps) {
  const [copied, setCopied] = React.useState(false);

  const totalNeeded = pendingOrdersValue + bufferAmount;

  const copyAmount = () => {
    navigator.clipboard.writeText(recommendedTransfer.toFixed(2));
    setCopied(true);
    toast.success('Amount copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          This Week's Calculation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Pending Orders Value</span>
            <span className="font-medium">${pendingOrdersValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Buffer Amount</span>
            <span className="font-medium">+ ${bufferAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Total Needed</span>
            <span className="font-medium">${totalNeeded.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Current ZMA Balance</span>
            <span className="font-medium text-green-600">- ${currentBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-3">
            <span className="font-semibold text-foreground flex items-center gap-2">
              💰 TRANSFER RECOMMENDED
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                ${recommendedTransfer.toFixed(2)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAmount}
                className="h-8"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {recommendedTransfer <= 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ No transfer needed this week. Current balance covers pending orders with buffer.
            </p>
          </div>
        )}

        {recommendedTransfer > 0 && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Transfer Instructions:</strong> Use PayPal to send ${recommendedTransfer.toFixed(2)} to your Zinc ZMA account. After transfer is confirmed, record it using the button below.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
