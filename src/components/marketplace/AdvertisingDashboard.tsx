
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, ImageUp, Calendar, Tag } from "lucide-react";

const AdvertisingDashboard = () => {
  const [activePromos, setActivePromos] = useState(true);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advertising & Promotions</CardTitle>
          <CardDescription>
            Increase visibility for your products with promotional campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="banners">Banners & Creatives</TabsTrigger>
              <TabsTrigger value="labels">Promotional Labels</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="promo-toggle" 
                    checked={activePromos} 
                    onCheckedChange={setActivePromos} 
                  />
                  <Label htmlFor="promo-toggle">Show active promotions only</Label>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Mother's Day Collection</h3>
                        <p className="text-sm text-muted-foreground">Apr 15 - May 15, 2023</p>
                        <div className="flex items-center mt-2">
                          <Badge className="mr-2">Active</Badge>
                          <span className="text-xs text-muted-foreground">Featured on homepage</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Summer Essentials</h3>
                        <p className="text-sm text-muted-foreground">Jun 1 - Aug 31, 2023</p>
                        <div className="flex items-center mt-2">
                          <Badge variant="outline" className="mr-2">Scheduled</Badge>
                          <span className="text-xs text-muted-foreground">Category feature</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="banners" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Banner Creatives</h3>
                <Button>
                  <ImageUp className="h-4 w-4 mr-2" />
                  Upload Banner
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4 text-center">
                  <div className="bg-gray-100 h-32 rounded flex items-center justify-center mb-2">
                    <ImageUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Homepage Banner</p>
                    <p className="text-xs text-muted-foreground">1200 x 400 px</p>
                    <Button variant="outline" size="sm">Upload</Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 text-center">
                  <div className="bg-gray-100 h-32 rounded flex items-center justify-center mb-2">
                    <ImageUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Category Banner</p>
                    <p className="text-xs text-muted-foreground">800 x 300 px</p>
                    <Button variant="outline" size="sm">Upload</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="labels" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Promotional Labels</h3>
                <Button>
                  <Tag className="h-4 w-4 mr-2" />
                  Create Label
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium mr-3">
                        SALE
                      </div>
                      <div>
                        <p className="font-medium">Sale Label</p>
                        <p className="text-xs text-muted-foreground">Applied to 5 products</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium mr-3">
                        NEW
                      </div>
                      <div>
                        <p className="font-medium">New Arrival</p>
                        <p className="text-xs text-muted-foreground">Applied to 3 products</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-3">
                        LIMITED
                      </div>
                      <div>
                        <p className="font-medium">Limited Edition</p>
                        <p className="text-xs text-muted-foreground">Applied to 2 products</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Badge component needed for the advertising dashboard
const Badge = ({ 
  children, 
  className = "", 
  variant = "default" 
}) => {
  const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  const variantClasses = {
    default: "bg-green-100 text-green-800",
    outline: "bg-transparent text-gray-700 border border-gray-300",
    secondary: "bg-gray-100 text-gray-800"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default AdvertisingDashboard;
