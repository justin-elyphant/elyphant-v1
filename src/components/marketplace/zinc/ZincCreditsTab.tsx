import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMockReturns } from "./returnService";

// Mock credit data
const mockCredits = [
  {
    id: "crd_123456",
    customerName: "Jane Smith",
    customerId: "cus_123456",
    returnId: "ret_789012",
    amount: 49.99,
    status: "active",
    expiryDate: "2025-07-01T00:00:00Z",
    createdDate: "2025-04-02T14:45:00Z",
    lastUpdated: "2025-04-02T14:45:00Z"
  },
  {
    id: "crd_123457",
    customerName: "Michael Brown",
    customerId: "cus_123789",
    returnId: "ret_789099",
    amount: 129.99,
    status: "used",
    expiryDate: "2025-06-15T00:00:00Z",
    createdDate: "2025-03-15T10:30:00Z",
    lastUpdated: "2025-03-20T16:45:00Z"
  },
  {
    id: "crd_123458",
    customerName: "Sarah Johnson",
    customerId: "cus_124567",
    returnId: "ret_789456",
    amount: 79.99,
    status: "expired",
    expiryDate: "2025-03-01T00:00:00Z",
    createdDate: "2025-01-10T08:15:00Z",
    lastUpdated: "2025-03-02T00:00:01Z"
  }
];

const ZincCreditsTab = () => {
  const [pendingReturns, setPendingReturns] = useState(() => 
    getMockReturns().filter(ret => 
      ret.status === "completed" && !ret.creditIssued
    )
  );
  const [activeCredits, setActiveCredits] = useState(() => 
    mockCredits.filter(credit => credit.status === "active")
  );
  
  const [newCreditAmount, setNewCreditAmount] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null);
  
  const handleIssueCredit = () => {
    if (!selectedReturn || !newCreditAmount) {
      toast.error("Please select a return and enter a credit amount");
      return;
    }
    
    const amount = parseFloat(newCreditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }
    
    // Find the return to issue credit for
    const returnToCredit = pendingReturns.find(ret => ret.id === selectedReturn);
    if (!returnToCredit) return;
    
    // Create a new credit
    const newCredit = {
      id: `crd_${Math.floor(Math.random() * 1000000)}`,
      customerName: returnToCredit.customerName,
      customerId: `cus_${Math.floor(Math.random() * 1000000)}`,
      returnId: returnToCredit.id,
      amount,
      status: "active",
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    // Update state
    setActiveCredits(prev => [...prev, newCredit]);
    setPendingReturns(prev => prev.filter(ret => ret.id !== selectedReturn));
    
    // Reset form
    setSelectedReturn(null);
    setNewCreditAmount("");
    
    toast.success(`Credit of ${formatPrice(amount)} issued to ${returnToCredit.customerName}`);
  };

  return (
    <div className="space-y-4 py-4">
      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active">Active Credits</TabsTrigger>
          <TabsTrigger value="issue">Issue Credit</TabsTrigger>
          <TabsTrigger value="history">Credit History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4 pt-4">
          <h3 className="font-medium">Active Elephant Credits</h3>
          
          {activeCredits.length === 0 ? (
            <Card>
              <CardContent className="flex justify-center items-center py-6">
                <p className="text-muted-foreground">No active credits found</p>
              </CardContent>
            </Card>
          ) : (
            activeCredits.map(credit => (
              <Card key={credit.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Credit #{credit.id.slice(-6)}</CardTitle>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{credit.customerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{formatPrice(credit.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Issued:</span>
                      <span>{new Date(credit.createdDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{new Date(credit.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button variant="outline" size="sm">Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="issue" className="space-y-4 pt-4">
          <h3 className="font-medium">Issue New Elephant Credit</h3>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="return" className="block text-sm font-medium mb-1">
                    Select Return
                  </label>
                  <select 
                    id="return"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedReturn || ""}
                    onChange={(e) => setSelectedReturn(e.target.value)}
                  >
                    <option value="">Select a completed return</option>
                    {pendingReturns.length === 0 ? (
                      <option disabled>No eligible returns found</option>
                    ) : (
                      pendingReturns.map(ret => (
                        <option key={ret.id} value={ret.id}>
                          {ret.id.slice(-6)} - {ret.customerName} - {formatPrice(ret.item.price)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-1">
                    Credit Amount
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter credit amount"
                    value={newCreditAmount}
                    onChange={(e) => setNewCreditAmount(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleIssueCredit} 
                  disabled={!selectedReturn || !newCreditAmount || pendingReturns.length === 0}
                  className="w-full mt-4"
                >
                  Issue Elephant Credit
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">About Elephant Credits</h4>
            <p className="text-sm text-muted-foreground">
              Elephant Credits are store credits issued for returns instead of refunding the 
              original payment method. This encourages customers to make future purchases
              while simplifying the return process when gifts are involved.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 pt-4">
          <h3 className="font-medium">Credit History</h3>
          
          {mockCredits.filter(c => c.status !== "active").map(credit => (
            <Card key={credit.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Credit #{credit.id.slice(-6)}</CardTitle>
                  <Badge variant={credit.status === "used" ? "secondary" : "outline"}>
                    {credit.status.charAt(0).toUpperCase() + credit.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{credit.customerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{formatPrice(credit.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Issued:</span>
                    <span>{new Date(credit.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(credit.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" size="sm">Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ZincCreditsTab;
