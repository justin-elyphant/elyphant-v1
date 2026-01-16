import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Wishlist } from "@/types/profile";

const wishlistFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

type FormValues = z.infer<typeof wishlistFormSchema>;

interface EditWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  wishlist: Wishlist | null;
}

const EditWishlistDialog = ({
  open,
  onOpenChange,
  onSubmit,
  wishlist,
}: EditWishlistDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: {
      title: wishlist?.title || "",
      description: wishlist?.description || "",
    },
  });

  const { formState, reset } = form;
  const isSubmitting = formState.isSubmitting;

  // Reset form when wishlist changes
  useEffect(() => {
    if (wishlist) {
      reset({
        title: wishlist.title,
        description: wishlist.description || "",
      });
    }
  }, [wishlist, reset, open]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  // Reset form when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && wishlist) {
      reset({
        title: wishlist.title,
        description: wishlist.description || "",
      });
    }
    onOpenChange(isOpen);
  };

  if (!wishlist) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Wishlist</DialogTitle>
          <DialogDescription>
            Update your wishlist details.
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
                    <Input {...field} placeholder="My Wishlist" />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Add a description for your wishlist..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditWishlistDialog;
