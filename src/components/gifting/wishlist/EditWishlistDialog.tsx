
import React, { useEffect, useState } from "react";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wishlist } from "@/types/profile";
import { Separator } from "@/components/ui/separator";
import EnhancedTagInput from "./EnhancedTagInput";
import { normalizeTags } from "@/lib/utils";

const wishlistFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "Cannot add more than 10 tags").optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium")
});

type FormValues = z.infer<typeof wishlistFormSchema>;

interface EditWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  wishlist: Wishlist | null;
}

const WISHLIST_CATEGORIES = [
  { value: "birthday", label: "Birthday" },
  { value: "holiday", label: "Holiday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "wedding", label: "Wedding" },
  { value: "baby", label: "Baby" },
  { value: "personal", label: "Personal" },
  { value: "shopping", label: "Shopping" },
  { value: "gift-ideas", label: "Gift Ideas" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const EditWishlistDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  wishlist 
}: EditWishlistDialogProps) => {
  // Manage tags state separately to make the component more responsive
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: {
      title: wishlist?.title || "",
      description: wishlist?.description || "",
      category: wishlist?.category || "personal",
      tags: wishlist?.tags || [],
      priority: (wishlist?.priority as "low" | "medium" | "high") || "medium"
    }
  });
  
  const { formState, reset } = form;
  const isSubmitting = formState.isSubmitting;

  // Reset form when wishlist changes
  useEffect(() => {
    if (wishlist) {
      reset({
        title: wishlist.title,
        description: wishlist.description || "",
        category: wishlist.category || "personal",
        tags: wishlist.tags || [],
        priority: (wishlist.priority as "low" | "medium" | "high") || "medium"
      });
      
      // Initialize tags state from wishlist
      setTags(wishlist.tags || []);
    }
  }, [wishlist, reset, open]);
  
  const handleSubmit = async (values: FormValues) => {
    // Normalize tags and merge with form values
    const normalizedValues = {
      ...values,
      tags: normalizeTags(tags)
    };
    
    await onSubmit(normalizedValues);
  };
  
  // Reset form and tags when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open && wishlist) {
      reset({
        title: wishlist.title,
        description: wishlist.description || "",
        category: wishlist.category || "personal",
        tags: wishlist.tags || [],
        priority: (wishlist.priority as "low" | "medium" | "high") || "medium"
      });
      setTags(wishlist.tags || []);
    }
    onOpenChange(open);
  };

  if (!wishlist) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                    <Input {...field} />
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
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Organization</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "personal"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WISHLIST_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a category for your wishlist
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set the importance level
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormControl>
                      <EnhancedTagInput 
                        tags={tags}
                        onChange={setTags}
                        placeholder="Add tags to organize your wishlist..."
                        disabled={isSubmitting}
                        maxTags={10}
                        wishlistTitle={wishlist?.title || ""}
                        wishlistDescription={wishlist?.description || ""}
                        category={wishlist?.category}
                        showSuggestions={true}
                      />
                    </FormControl>
                    <FormDescription>
                      Smart suggestions help you organize and find your wishlist later
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
