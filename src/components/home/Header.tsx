
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift, Search, User, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center">
            <Gift className="h-6 w-6 text-purple-600 mr-2" />
            <h1 className="text-2xl font-bold">Elyphant</h1>
          </div>
          
          <div className="w-full md:w-2/5 lg:w-1/3 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search for products..." 
                className="pl-10"
              />
            </div>
          </div>
          
          <nav className="flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/sign-in">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/sign-up">
                <User className="mr-2 h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
