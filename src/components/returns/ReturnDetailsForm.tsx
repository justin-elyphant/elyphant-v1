
import React from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface ReturnDetailsFormProps {
  orderId: string;
  handleSubmitReturn: () => void;
}

const ReturnDetailsForm = ({ orderId, handleSubmitReturn }: ReturnDetailsFormProps) => {
  const form = useForm({
    defaultValues: {
      additionalNotes: ""
    }
  });

  const onSubmit = (data) => {
    console.log("Form data:", data);
    handleSubmitReturn();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return Details</CardTitle>
        <CardDescription>
          Please provide additional information about your return
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any additional details about the return"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This information helps us process your return more efficiently.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Submit Return Request
              </button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReturnDetailsForm;
