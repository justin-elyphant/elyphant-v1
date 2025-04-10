
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Mail, Phone, Clock, Package, MessageCircle, AlertCircle, CreditCard, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock customer data
const mockCustomers = [
  {
    id: "cust-001",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 415-555-2671",
    status: "active",
    customerSince: "March 2023",
    lastActive: "2 days ago",
    avatar: "/placeholder.svg",
    orderCount: 8,
    totalSpent: "$742.55",
    returns: 1,
    paymentMethod: "Visa ending in 4582",
    addresses: [
      {
        type: "Shipping",
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zip: "94107"
      },
      {
        type: "Billing",
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zip: "94107"
      }
    ],
    orders: [
      { id: "ORD-7842", date: "Apr 12, 2024", status: "Delivered", total: "$159.99" },
      { id: "ORD-6723", date: "Mar 03, 2024", status: "Delivered", total: "$89.95" },
      { id: "ORD-5912", date: "Feb 17, 2024", status: "Delivered", total: "$215.45" }
    ],
    wishlists: [
      { id: "WSL-001", name: "Birthday Ideas", itemCount: 5 },
      { id: "WSL-002", name: "Holiday List", itemCount: 7 }
    ],
    supportRequests: [
      { id: "SR-3421", date: "Mar 28, 2024", status: "Resolved", subject: "Order delay inquiry" },
      { id: "SR-2910", date: "Jan 15, 2024", status: "Closed", subject: "Return request for ORD-4872" }
    ]
  },
  {
    id: "cust-002",
    name: "Michael Chen",
    email: "michael.c@example.com",
    phone: "+1 312-555-9483",
    status: "active",
    customerSince: "November 2022",
    lastActive: "5 hours ago",
    avatar: "/placeholder.svg",
    orderCount: 12,
    totalSpent: "$1,245.78",
    returns: 0,
    paymentMethod: "Mastercard ending in 8731",
    addresses: [
      {
        type: "Shipping",
        street: "456 Oak Avenue",
        city: "Chicago",
        state: "IL",
        zip: "60613"
      }
    ],
    orders: [
      { id: "ORD-8012", date: "Apr 25, 2024", status: "Shipped", total: "$124.50" },
      { id: "ORD-7593", date: "Mar 19, 2024", status: "Delivered", total: "$215.99" }
    ],
    wishlists: [
      { id: "WSL-023", name: "Tech Gadgets", itemCount: 12 }
    ],
    supportRequests: []
  }
];

const TrunklineCustomersTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const filteredCustomers = mockCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
    
    setSearchResults(filteredCustomers);
  };

  const viewCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search customers by name, email, or phone..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="border rounded-md divide-y">
              {searchResults.map((customer) => (
                <div key={customer.id} className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => viewCustomer(customer)}>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={customer.avatar} alt={customer.name} />
                      <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                    </div>
                  </div>
                  <div>
                    <Badge variant={customer.status === 'active' ? "default" : "secondary"} className={customer.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {customer.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="border rounded-md p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found. Try a different search term.</p>
            </div>
          ) : (
            <div className="border rounded-md p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Enter a search term to find customers.</p>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchTerm("Sarah")}>Sarah Johnson</Badge>
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchTerm("Michael")}>Michael Chen</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                  <AvatarFallback>{selectedCustomer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedCustomer.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCustomer.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedCustomer.phone}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-muted-foreground">Customer Since</div>
                <div className="font-medium mt-1 flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {selectedCustomer.customerSince}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-muted-foreground">Total Orders</div>
                <div className="font-medium mt-1 flex items-center gap-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {selectedCustomer.orderCount}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-muted-foreground">Total Spent</div>
                <div className="font-medium mt-1 flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {selectedCustomer.totalSpent}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-muted-foreground">Returns</div>
                <div className="font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  {selectedCustomer.returns}
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="orders">
              <TabsList className="mb-4">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="details">Customer Details</TabsTrigger>
                <TabsTrigger value="wishlist">Wishlists</TabsTrigger>
                <TabsTrigger value="support">Support History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Order ID</th>
                        <th className="text-left px-4 py-3 font-medium">Date</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-left px-4 py-3 font-medium">Total</th>
                        <th className="text-right px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedCustomer.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{order.id}</td>
                          <td className="px-4 py-3">{order.date}</td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              order.status === 'Delivered' ? 'default' : 
                              order.status === 'Shipped' ? 'default' : 'secondary'
                            } className={order.status === 'Delivered' ? 'bg-green-500 hover:bg-green-600' : ''}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{order.total}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="details">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-medium mb-3">Addresses</h3>
                    <div className="space-y-4">
                      {selectedCustomer.addresses.map((address, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="font-medium mb-1">{address.type} Address</div>
                          <div className="text-sm text-muted-foreground">{address.street}</div>
                          <div className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.zip}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium mb-3">Payment Methods</h3>
                    <div className="border rounded-md p-4">
                      <div className="font-medium mb-1">Default Payment</div>
                      <div className="text-sm text-muted-foreground">{selectedCustomer.paymentMethod}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="wishlist">
                <div className="grid grid-cols-2 gap-4">
                  {selectedCustomer.wishlists.map(wishlist => (
                    <div key={wishlist.id} className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{wishlist.name}</div>
                          <div className="text-sm text-muted-foreground">{wishlist.itemCount} items</div>
                        </div>
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="support">
                {selectedCustomer.supportRequests.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Ticket ID</th>
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-left px-4 py-3 font-medium">Subject</th>
                          <th className="text-left px-4 py-3 font-medium">Status</th>
                          <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedCustomer.supportRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{request.id}</td>
                            <td className="px-4 py-3">{request.date}</td>
                            <td className="px-4 py-3">{request.subject}</td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                request.status === 'Resolved' ? 'default' : 
                                request.status === 'Open' ? 'default' : 'secondary'
                              } className={request.status === 'Resolved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                {request.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm">View</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border rounded-md p-8 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No support requests found.</p>
                    <Button className="mt-4" variant="outline" size="sm">
                      Create Support Ticket
                    </Button>
                  </div>
                )}
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
      )}
    </div>
  );
};

export default TrunklineCustomersTab;
