
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { getMockOrders } from "@/components/marketplace/zinc/orderService";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrdersTable from "@/components/orders/OrdersTable";
import { useOrderSort } from "@/components/orders/hooks/useOrderSort";
import OrderSkeleton from "@/components/orders/OrderSkeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const Orders = () => {
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  
  // Use our custom hook for sorting
  const { sortField, sortDirection, handleSort, getSortIcon, sortedOrders } = useOrderSort(orders);

  // Redirect to sign-up if not logged in
  React.useEffect(() => {
    if (!userData) {
      navigate("/signup");
    }
  }, [userData, navigate]);

  // Load orders with simulated delay (removes when connected to real API)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setOrders(getMockOrders());
      setIsLoading(false);
    }, 800); // Simulated loading time
    
    return () => clearTimeout(timer);
  }, []);

  const refreshOrders = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(getMockOrders());
      setIsRefreshing(false);
    }, 500);
  };

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!userData) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <OrdersHeader refreshOrders={refreshOrders} isRefreshing={isRefreshing} />

      {/* Order list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            {isLoading 
              ? "Loading orders..." 
              : `Showing ${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <OrderSkeleton />
          ) : (
            <>
              <OrdersTable 
                orders={currentOrders} 
                sortField={sortField}
                sortDirection={sortDirection}
                handleSort={handleSort}
                getSortIcon={getSortIcon}
              />
              
              {/* Pagination */}
              {sortedOrders.length > ordersPerPage && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && paginate(currentPage - 1)} 
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            onClick={() => paginate(i + 1)}
                            isActive={currentPage === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && paginate(currentPage + 1)} 
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
