import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { vendorProductSchema, VendorProductFormValues, PRODUCT_CATEGORIES } from "./vendorProductSchema";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAccount } from "@/hooks/vendor/useVendorAccount";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ManualProductFormProps {
  onClose: () => void;
}

export const ManualProductForm = ({ onClose }: ManualProductFormProps) => {
  const { data: vendorAccount } = useVendorAccount();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<VendorProductFormValues>({
    resolver: zodResolver(vendorProductSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category: "",
      brand: "",
      sku: "",
      image_url: "",
      fulfillment_type: "physical",
      status: "draft",
    },
  });

  const onSubmit = async (values: VendorProductFormValues) => {
    if (!vendorAccount?.id) {
      toast.error("Vendor account not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("products").insert({
        product_id: `vendor_${vendorAccount.id}_${Date.now()}`,
        title: values.title,
        price: values.price,
        image_url: values.image_url || null,
        category: values.category,
        brand: values.brand,
        retailer: vendorAccount.company_name || "Vendor",
        vendor_account_id: vendorAccount.id,
        source_query: "vendor_manual",
        metadata: {
          description: values.description,
          sku: values.sku,
          fulfillment_type: values.fulfillment_type,
          status: values.status,
          product_source: "vendor_portal",
        },
      } as any);

      if (error) throw error;

      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>Create a product listing manually</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Product Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Fresh Rose Bouquet" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0" placeholder="49.99" {...field} /></FormControl>
                  <FormDescription>Your retail price. 30% markup is added automatically.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl><Input placeholder="Your brand name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Optional)</FormLabel>
                  <FormControl><Input placeholder="SKU-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="image_url" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl><Input placeholder="https://example.com/product.jpg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Describe your product..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fulfillment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fulfillment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="physical">Physical Shipping</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="pickup">In-Store Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Product
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
