
import React from "react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/contexts/profile/ProfileContext";

const wishlistFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

type FormValues = z.infer<typeof wishlistFormSchema>;

interface CreateWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { title: string; description?: string; category?: string; tags?: string[]; priority?: "low" | "medium" | "high" }) => Promise<void>;
}

const INTEREST_PLACEHOLDERS: Record<string, string> = {
  fitness: "My Running Gear",
  technology: "Tech Wishlist",
  cooking: "Kitchen Must-Haves",
  gaming: "Gaming Setup",
  fashion: "Style Picks",
  beauty: "Beauty Favorites",
  travel: "Travel Essentials",
  reading: "Book List",
  music: "Music Gear",
  sports: "Sports Equipment",
  outdoor: "Outdoor Adventures",
  home: "Home Décor Ideas",
};

function getSmartPlaceholder(interests?: string[]): string {
  if (!interests?.length) return "My Birthday Picks";
  for (const interest of interests) {
    const key = interest.toLowerCase();
    for (const [k, v] of Object.entries(INTEREST_PLACEHOLDERS)) {
      if (key.includes(k)) return v;
    }
  }
  return "My Birthday Picks";
}

const CreateWishlistDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit 
}: CreateWishlistDialogProps) => {
  const { profile } = useProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: {
      title: "",
      description: "",
    }
  });
  
  const { formState, reset } = form;
  const isSubmitting = formState.isSubmitting;
  
  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      ...values,
      category: "personal",
      tags: [],
      priority: "medium",
    });
    reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const placeholder = getSmartPlaceholder(profile?.interests as string[] | undefined);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white p-6 md:p-8"
        style={{
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">Create New Wishlist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Save and share your gift ideas.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase tracking-wider text-xs text-muted-foreground font-medium">Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={placeholder} 
                      {...field} 
                      className="border-border/60 focus:bg-[#F7F7F7] transition-colors"
                    />
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
                  <FormLabel className="uppercase tracking-wider text-xs text-muted-foreground font-medium">
                    Description <span className="normal-case tracking-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What's this wishlist for?" 
                      {...field}
                      value={field.value || ""}
                      className="resize-none border-border/60 focus:bg-[#F7F7F7] transition-colors min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="border-foreground/20 hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Wishlist"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWishlistDialog;
