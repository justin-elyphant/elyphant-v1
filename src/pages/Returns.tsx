
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Package,
  RefreshCw
} from "lucide-react";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import { getMockReturns } from "@/components/marketplace/zinc/returnService";
import { ZincOrder, ZincReturn } from "@/components/marketplace/zinc/types";
import { toast } from "sonner";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

const Returns = () => {
  const { orderId } = useParams();
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [order, setOrder] = useState<ZincOrder | null>(null);
  const [existingReturns, setExistingReturns] = useState<ZincReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: {
      reason: "",
      additionalNotes: ""
    }
  });

  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);

  // Load order details and check for existing returns
  useEffect(() => {
    if (!orderId) return;
    
    setIsLoading(true);
    
    // Simulate API call to get order details
    setTimeout(() => {
      const orders = getMockOrders();
      const foundOrder = orders.find(o => o.id === orderId);
      
      if (foundOrder) {
        setOrder(foundOrder);
        
        // Check for existing returns for this order
        const returns = getMockReturns().filter(r => r.orderId === orderId || r.order_id === orderId);
        setExistingReturns(returns);
        
        // Initialize selected items state
        if (foundOrder.items) {
          const initialSelectedItems: Record<string, boolean> = {};
          const initialReasons: Record<string, string> = {};
          
          foundOrder.items.forEach((item, index) => {
            initialSelectedItems[index] = false;
            initialReasons[index] = "";
          });
          
          setSelectedItems(initialSelectedItems);
          setReturnReasons(initialReasons);
        }
      } else {
        toast.error("Order not found");
        navigate("/orders");
      }
      
      setIsLoading(false);
    }, 500);
  }, [orderId, navigate]);

  const handleItemSelection = (index: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleReasonChange = (index: string, reason: string) => {
    setReturnReasons(prev => ({
      ...prev,
      [index]: reason
    }));
  };

  const handleSubmitReturn = () => {
    // Get selected items
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([index]) => {
        const itemIndex = parseInt(index);
        return {
          ...order!.items![itemIndex],
          reason: returnReasons[index] || "Other"
        };
      });
    
    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }
    
    // Simulate API call to create return
    toast.loading("Processing your return request...");
    
    setTimeout(() => {
      toast.dismiss();
      toast.success("Return request submitted successfully");
      navigate("/orders");
    }, 1500);
  };

  if (!userData || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 flex justify-center">
        <div className="animate-pulse flex flex-col w-full max-w-3xl">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (existingReturns.length > 0) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Existing Return Requests</CardTitle>
            <CardDescription>
              You already have return requests for this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingReturns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-medium">#{returnItem.id.slice(-6)}</TableCell>
                    <TableCell>{new Date(returnItem.requestDate || returnItem.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}</TableCell>
                    <TableCell>{returnItem.item?.name || returnItem.items[0].product_id}</TableCell>
                    <TableCell>{returnItem.reason || returnItem.items[0].reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/orders")}>
              View All Orders
            </Button>
            <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
              View Order Details
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">We couldn't find the order you're looking for.</p>
            <Button onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Order
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Return Items</h1>
        <p className="text-muted-foreground">
          Order #{order.id.slice(-6)} • Placed on {new Date(order.date!).toLocaleDateString()}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Items to Return</CardTitle>
          <CardDescription>
            Choose which items you want to return and select a reason
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Return</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedItems[index.toString()]}
                      onCheckedChange={() => handleItemSelection(index.toString())}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.price?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select 
                      disabled={!selectedItems[index.toString()]}
                      value={returnReasons[index.toString()]}
                      onValueChange={(value) => handleReasonChange(index.toString(), value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defective">Defective product</SelectItem>
                        <SelectItem value="damaged">Damaged during shipping</SelectItem>
                        <SelectItem value="wrong">Wrong item received</SelectItem>
                        <SelectItem value="not_needed">No longer needed</SelectItem>
                        <SelectItem value="not_expected">Not as expected</SelectItem>
                        <SelectItem value="other">Other reason</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Return Details</CardTitle>
          <CardDescription>
            Please provide additional information about your return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide any additional details about the return" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This information helps us process your return more efficiently.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReturn}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Submit Return Request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Returns;
