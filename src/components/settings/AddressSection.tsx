
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AddressAutocomplete from "./AddressAutocomplete";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";

const AddressSection = () => {
  const form = useFormContext();
  
  const handleAddressAutocomplete = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    form.setValue("address.street", address.address);
    form.setValue("address.city", address.city);
    form.setValue("address.state", address.state);
    form.setValue("address.zipCode", address.zipCode);
    form.setValue("address.country", address.country);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Shipping Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="address.street"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <AddressAutocomplete
                value={field.value}
                onChange={field.onChange}
                onAddressSelect={handleAddressAutocomplete}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address.city"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <Label htmlFor="city">City</Label>
              <FormControl>
                <Input 
                  id="city"
                  placeholder="New York"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address.state"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <FormControl>
                <Input 
                  id="state"
                  placeholder="NY"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address.zipCode"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <Label htmlFor="zipCode">Postal/Zip Code</Label>
              <FormControl>
                <Input 
                  id="zipCode"
                  placeholder="10001"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address.country"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <FormControl>
                <Input 
                  id="country"
                  placeholder="United States"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default AddressSection;
