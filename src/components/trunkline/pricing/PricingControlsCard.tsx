
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Percent, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CategoryMarkup {
  [key: string]: number;
}

const PricingControlsCard = () => {
  const [globalMarkup, setGlobalMarkup] = useState(20);
  const [categoryMarkups, setCategoryMarkups] = useState<CategoryMarkup>({
    electronics: 25,
    clothing: 30,
    home: 20,
    toys: 35,
    beauty: 40
  });
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryMarkup, setNewCategoryMarkup] = useState(25);
  
  const handleCategoryMarkupChange = (category: string, value: number) => {
    setCategoryMarkups(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  const handleAddCategory = () => {
    if (!newCategory || newCategory.trim() === '') {
      toast.error("Please enter a category name");
      return;
    }
    
    if (categoryMarkups[newCategory.toLowerCase()]) {
      toast.error("This category already exists");
      return;
    }
    
    setCategoryMarkups(prev => ({
      ...prev,
      [newCategory.toLowerCase()]: newCategoryMarkup
    }));
    
    setNewCategory('');
    toast.success(`Added ${newCategory} category with ${newCategoryMarkup}% markup`);
  };
  
  const handleSaveMarkups = () => {
    // Here you would implement the actual saving logic to persist the markup settings
    console.log("Saving markups:", { globalMarkup, categoryMarkups });
    toast.success("Pricing markups saved successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Controls</CardTitle>
        <CardDescription>
          Set platform-wide or category-specific markup percentages for products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global">
          <TabsList className="mb-4">
            <TabsTrigger value="global">Global Markup</TabsTrigger>
            <TabsTrigger value="category">Category Markup</TabsTrigger>
            <TabsTrigger value="vendor">Vendor Markup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="global" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="globalMarkup">Global Markup Percentage</Label>
                  <span className="text-sm font-medium flex items-center">
                    <Percent className="h-3 w-3 mr-1" />
                    {globalMarkup}%
                  </span>
                </div>
                <Slider 
                  id="globalMarkup"
                  min={0} 
                  max={100} 
                  step={5} 
                  value={[globalMarkup]} 
                  onValueChange={(value) => setGlobalMarkup(value[0])}
                />
              </div>
              
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Example: A $100 product would sell for ${(100 * (1 + globalMarkup / 100)).toFixed(2)}</span>
                </div>
              </div>
              
              <Button onClick={handleSaveMarkups} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save Global Markup
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="category" className="space-y-4">
            <div className="space-y-4">
              {Object.entries(categoryMarkups).map(([category, markup]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={category} className="capitalize">{category} Markup</Label>
                    <span className="text-sm font-medium flex items-center">
                      <Percent className="h-3 w-3 mr-1" />
                      {markup}%
                    </span>
                  </div>
                  <Slider 
                    id={category}
                    min={0} 
                    max={100} 
                    step={5} 
                    value={[markup]} 
                    onValueChange={(value) => handleCategoryMarkupChange(category, value[0])}
                  />
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Add New Category</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Label htmlFor="newCategory" className="sr-only">New Category</Label>
                    <Input 
                      id="newCategory" 
                      placeholder="Category name" 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor="newMarkup" className="sr-only">Markup %</Label>
                    <div className="relative">
                      <Input 
                        id="newMarkup"
                        type="number"
                        placeholder="Markup %"
                        value={newCategoryMarkup}
                        onChange={(e) => setNewCategoryMarkup(parseInt(e.target.value) || 0)}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button onClick={handleAddCategory}>Add</Button>
                </div>
              </div>
              
              <Button onClick={handleSaveMarkups} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save Category Markups
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="vendor" className="space-y-4">
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Vendor-specific markup controls will be available soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PricingControlsCard;
