
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Customer } from "./mockData";
import CustomerHeader from "./CustomerHeader";
import CustomerStatCards from "./CustomerStatCards";
import OrdersTab from "./tabs/OrdersTab";
import DetailsTab from "./tabs/DetailsTab";
import WishlistTab from "./tabs/WishlistTab";
import SupportTab from "./tabs/SupportTab";

interface CustomerDetailsProps {
  customer: Customer;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CustomerHeader customer={customer} />
      </CardHeader>
      
      <CardContent className="pt-0">
        <CustomerStatCards customer={customer} />
        
        <Tabs defaultValue="orders">
          <TabsList className="mb-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="details">Customer Details</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlists</TabsTrigger>
            <TabsTrigger value="support">Support History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <OrdersTab customer={customer} />
          </TabsContent>
          
          <TabsContent value="details">
            <DetailsTab customer={customer} />
          </TabsContent>
          
          <TabsContent value="wishlist">
            <WishlistTab customer={customer} />
          </TabsContent>
          
          <TabsContent value="support">
            <SupportTab customer={customer} />
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end gap-2">
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Send Email</SelectItem>
              <SelectItem value="notes">Add Notes</SelectItem>
              <SelectItem value="flag">Flag Account</SelectItem>
              <SelectItem value="delete">Delete Customer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Edit Customer</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDetails;
