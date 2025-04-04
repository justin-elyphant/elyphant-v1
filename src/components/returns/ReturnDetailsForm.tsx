
import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      additionalNotes: ""
    }
  });

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
          <div className="space-y-4">
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
          </div>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
          Cancel
        </Button>
        <Button onClick={handleSubmitReturn}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Submit Return Request
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReturnDetailsForm;
