
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Home, Search, User, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

const GiftingHeader = () => {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <Gift className="h-6 w-6 text-purple-600 mr-2" />
              <span className="font-bold text-xl">Elyphant</span>
            </Link>
            
            <Link to="/" className="hidden md:flex items-center text-sm text-gray-500 hover:text-gray-900">
              <Home className="h-4 w-4 mr-1" />
              <span>Home</span>
            </Link>
          </div>
          
          <div className="hidden md:block w-full max-w-md mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="search" 
                placeholder="Search gifts, friends, or brands..." 
                className="pl-10 bg-gray-100 border-gray-200 focus:bg-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <User className="h-5 w-5" />
            </Button>
            
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Gift className="mr-2 h-4 w-4" />
              Create Wishlist
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
