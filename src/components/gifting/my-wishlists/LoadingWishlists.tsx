
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingWishlists: React.FC = () => (
  <div className="flex flex-col justify-center items-center py-16">
    <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
    <p className="text-muted-foreground">Loading your wishlists...</p>
  </div>
);

export default LoadingWishlists;
