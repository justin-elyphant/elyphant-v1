
import React from "react";

const OrderSkeleton = () => {
  return (
    <div className="animate-pulse flex flex-col w-full max-w-3xl">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>
  );
};

export default OrderSkeleton;
