
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCampaign, FundingCampaign } from '@/utils/crowdfundingService';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (campaign: FundingCampaign) => void;
}

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  goalAmount: z.number().min(1, { message: "Goal must be at least $1" }),
  campaignType: z.enum(['wedding', 'graduation', 'birthday', 'product', 'general']),
  endDate: z.string().optional(),
  productId: z.union([z.number(), z.string().transform(val => val === '' ? undefined : Number(val))]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      goalAmount: 100,
      campaignType: 'general',
      endDate: '',
      productId: undefined,
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const campaign = await createCampaign({
        title: values.title,
        description: values.description,
        goalAmount: values.goalAmount,
        campaignType: values.campaignType,
        endDate: values.endDate || undefined,
        productId: values.productId as number | undefined,
      });
      
      if (campaign) {
        onOpenChange(false);
        form.reset();
        if (onSuccess) onSuccess(campaign);
      }
    } catch (error) {
      toast.error("Failed to create campaign");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create Funding Campaign</DialogTitle>
            <DialogDescription>
              Create a funding campaign for a gift, event, or special occasion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                placeholder="Enter a catchy title for your campaign"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What are you raising funds for?"
                className="min-h-[100px]"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="goalAmount">Funding Goal ($)</Label>
                <Input
                  id="goalAmount"
                  type="number"
                  min="1"
                  {...form.register('goalAmount', { valueAsNumber: true })}
                />
                {form.formState.errors.goalAmount && (
                  <p className="text-xs text-destructive">{form.formState.errors.goalAmount.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select 
                  onValueChange={(value) => form.setValue('campaignType', value as FormValues['campaignType'])}
                  defaultValue={form.getValues('campaignType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register('endDate')}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="productId">Product ID (Optional)</Label>
                <Input
                  id="productId"
                  type="number"
                  placeholder="Link to a product"
                  {...form.register('productId')}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
