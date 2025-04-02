
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FiltersSidebar = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Price Range</h3>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                className="w-full px-3 py-2 border rounded-md"
              />
              <span>to</span>
              <input 
                type="number" 
                placeholder="Max" 
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Free Shipping</h3>
            <div className="flex items-center">
              <input type="checkbox" id="freeShipping" className="mr-2" />
              <label htmlFor="freeShipping">Free shipping</label>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Vendor</h3>
            <select className="w-full px-3 py-2 border rounded-md">
              <option>All Vendors</option>
              <option>Premium Gifts Co.</option>
              <option>Artisan Crafts</option>
              <option>Luxury Gift Box</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersSidebar;
