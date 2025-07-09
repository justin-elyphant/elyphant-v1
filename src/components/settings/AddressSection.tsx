
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";

const AddressSection = () => {
  const form = useFormContext();

  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    // Update all address fields when a place is selected
    form.setValue("address.street", standardizedAddress.street);
    form.setValue("address.city", standardizedAddress.city);
    form.setValue("address.state", standardizedAddress.state);
    form.setValue("address.zipCode", standardizedAddress.zipCode);
    form.setValue("address.country", standardizedAddress.country);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Shipping Address</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="address.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <GooglePlacesAutocomplete
                  value={field.value || ""}
                  onChange={field.onChange}
                  onAddressSelect={handleGooglePlacesSelect}
                  placeholder="Start typing your address..."
                  label=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apartment, Suite, Unit, etc. (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apt 2B, Suite 100, Unit 4..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address.city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input placeholder="California" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address.zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP/Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="94103" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address.country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressSection;
