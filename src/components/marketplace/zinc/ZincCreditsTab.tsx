
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Plus, Gift, History } from "lucide-react";

// Mock credit transactions
const mockTransactions = [
  {
    id: "tx_456789",
    userEmail: "jane.smith@example.com",
    userName: "Jane Smith",
    amount: 49.99,
    type: "return_credit",
    source: "Return #ret_789012",
    date: "2025-04-02T14:45:00Z",
    status: "active"
  },
  {
    id: "tx_456790",
    userEmail: "john.doe@example.com",
    userName: "John Doe",
    amount: 100.00,
    type: "manual_credit",
    source: "Customer Support",
    date: "2025-04-01T10:30:00Z",
    status: "active"
  },
  {
    id: "tx_456791",
    userEmail: "alex.johnson@example.com",
    userName: "Alex Johnson",
    amount: 25.00,
    type: "redemption",
    source: "Order #ord_123459",
    date: "2025-03-28T15:20:00Z",
    status: "used"
  }
];

const ZincCreditsTab = () => {
  // Function to get appropriate badge variant based on transaction type
  const getBadgeVariant = (type: string, status: string) => {
    if (status === "used") return "default";
    
    switch (type) {
      case "return_credit":
        return "warning";
      case "manual_credit":
        return "info";
      case "redemption":
        return "destructive";
      default:
        return "default";
    }
  };

  // Function to format transaction type for display
  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-medium">Elephant Credits</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <History className="h-3 w-3 mr-1" />
            Transaction History
          </Button>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Issue Credit
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
            Issue Credit to Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-email" className="text-sm font-medium mb-1 block">
                  Customer Email
                </label>
                <Input id="customer-email" placeholder="customer@example.com" />
              </div>
              <div>
                <label htmlFor="credit-amount" className="text-sm font-medium mb-1 block">
                  Credit Amount ($)
                </label>
                <Input id="credit-amount" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label htmlFor="credit-reason" className="text-sm font-medium mb-1 block">
                Reason (Optional)
              </label>
              <Input id="credit-reason" placeholder="Reason for issuing credit" />
            </div>
            <div className="flex justify-end">
              <Button>
                <Gift className="h-4 w-4 mr-2" />
                Issue Elephant Credit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <h3 className="font-medium mb-4">Recent Transactions</h3>
        
        {mockTransactions.map(transaction => (
          <Card key={transaction.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div className="flex items-center">
                  <h4 className="font-medium">{transaction.userName}</h4>
                  <Badge variant={getBadgeVariant(transaction.type, transaction.status) as any} className="ml-2">
                    {transaction.status === "used" ? "Used" : formatTransactionType(transaction.type)}
                  </Badge>
                </div>
                <span className={`font-semibold ${transaction.type === "redemption" ? "text-red-500" : "text-green-500"}`}>
                  {transaction.type === "redemption" ? "-" : "+"}${transaction.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span>{transaction.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source:</span>
                  <span>{transaction.source}</span>
                </div>
              </div>
              
              <div className="mt-2 flex justify-end">
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ZincCreditsTab;
