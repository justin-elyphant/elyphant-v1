
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
import { Button } from "@/components/ui/button";
import ReturnStatusTimeline from "./ReturnStatusTimeline";

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

  // For demonstration, we'll use today's date
  const today = new Date().toISOString();

  return (
    <div className="space-y-6">
      <ReturnStatusTimeline 
        currentStatus="requested" 
        requestDate={today}
      />
      
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
                <Button type="submit">
                  Submit Return Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReturnDetailsForm;
