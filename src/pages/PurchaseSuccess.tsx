
import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const PurchaseSuccess = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');

  useEffect(() => {
    toast({
      title: "Purchase Successful!",
      description: "Your order has been confirmed and will be processed shortly."
    });
  }, [toast]);

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl font-bold">Purchase Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Thank you for your purchase! Your order has been confirmed and will be
            processed shortly.
          </p>
          <div className="border-t border-b py-4 my-4 border-gray-100">
            <p className="font-medium">Order Details</p>
            <p className="text-sm text-muted-foreground">
              A confirmation email with your order details has been sent to your email address.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/orders">View Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/marketplace">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PurchaseSuccess;
