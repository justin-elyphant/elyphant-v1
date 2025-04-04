
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ZincReturn } from "@/components/marketplace/zinc/types";

interface ExistingReturnsCardProps {
  existingReturns: ZincReturn[];
  orderId: string;
}

const ExistingReturnsCard = ({ existingReturns, orderId }: ExistingReturnsCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Return Requests</CardTitle>
        <CardDescription>
          You already have return requests for this order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return ID</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {existingReturns.map((returnItem) => (
              <TableRow key={returnItem.id}>
                <TableCell className="font-medium">#{returnItem.id.slice(-6)}</TableCell>
                <TableCell>{new Date(returnItem.requestDate || returnItem.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}</TableCell>
                <TableCell>{returnItem.item?.name || returnItem.items[0].product_id}</TableCell>
                <TableCell>{returnItem.reason || returnItem.items[0].reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/orders")}>
          View All Orders
        </Button>
        <Button variant="outline" onClick={() => navigate(`/orders/${orderId}`)}>
          View Order Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExistingReturnsCard;
