
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User } from "lucide-react";

const GiftingHeader = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const pageTitleParam = searchParams.get("pageTitle");
  
  // Don't show header for specific collection or occasion views
  const isSpecificView = Boolean(categoryParam || pageTitleParam);
  
  if (isSpecificView) {
    return null; // Don't render the header at all for specific views
  }
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <User className="h-5 w-5" />
            </Button>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GiftingHeader;
