
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wishlist } from "@/types/profile";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(100),
  description: z.string().max(500, { message: "Description must be less than 500 characters" }).optional(),
});

type WishlistFormValues = z.infer<typeof formSchema>;

interface EditWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WishlistFormValues) => void;
  wishlist: Wishlist | null;
}

const EditWishlistDialog = ({
  open,
  onOpenChange,
  onSubmit,
  wishlist,
}: EditWishlistDialogProps) => {
  const form = useForm<WishlistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Update form values when wishlist changes
  useEffect(() => {
    if (wishlist) {
      form.reset({
        title: wishlist.title,
        description: wishlist.description,
      });
    }
  }, [wishlist, form]);

  const handleSubmit = (values: WishlistFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Wishlist</DialogTitle>
          <DialogDescription>
            Update the name and description for your wishlist.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Birthday Wishlist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Things I'd like to receive for my birthday..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWishlistDialog;
