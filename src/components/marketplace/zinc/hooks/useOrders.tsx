
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch orders from local storage or an API
    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    }
  }, []);

  const addOrder = async (orderData) => {
    setLoading(true);
    try {
      // Simulate creating an order
      const newOrder = {
        id: `order-${Date.now()}`,
        ...orderData,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Update state and local storage
      setOrders(prevOrders => [...prevOrders, newOrder]);
      localStorage.setItem('orders', JSON.stringify([...orders, newOrder]));

      toast.success('Order created successfully!');
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    addOrder,
  };
};
