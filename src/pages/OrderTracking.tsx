
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  MapPin, 
  ArrowLeft, 
  Truck, 
  CheckCircle2, 
  Clock, 
  PackageOpen, 
  Calendar, 
  Gift 
} from 'lucide-react';
import { toast } from "sonner";

interface TrackingStep {
  status: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

interface OrderDetails {
  id: string;
  status: 'processing' | 'shipped' | 'delivered' | 'failed';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  shippedDate: string;
  isGift: boolean;
  recipientName?: string;
  steps: TrackingStep[];
  productName: string;
  productImage: string;
}

const DEMO_ORDER: OrderDetails = {
  id: 'ORD-12345',
  status: 'shipped',
  trackingNumber: '9400123456789012345678',
  carrier: 'USPS',
  estimatedDelivery: '2025-05-15',
  shippedDate: '2025-05-10',
  isGift: true,
  recipientName: 'Alex Johnson',
  productName: 'Leather Wallet',
  productImage: 'https://picsum.photos/200/300?random=1',
  steps: [
    {
      status: 'Order Placed',
      location: 'Online',
      timestamp: '2025-05-08 14:30',
      completed: true,
      current: false
    },
    {
      status: 'Order Processed',
      location: 'Warehouse',
      timestamp: '2025-05-09 10:15',
      completed: true,
      current: false
    },
    {
      status: 'Shipped',
      location: 'Distribution Center',
      timestamp: '2025-05-10 08:45',
      completed: true,
      current: true
    },
    {
      status: 'Out for Delivery',
      location: '',
      timestamp: '',
      completed: false,
      current: false
    },
    {
      status: 'Delivered',
      location: '',
      timestamp: '',
      completed: false,
      current: false
    }
  ]
};

import EnhancedOrderTracking from "@/components/tracking/EnhancedOrderTracking";

const OrderTracking = () => {
  return <EnhancedOrderTracking />;
};

export default OrderTracking;
