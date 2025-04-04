
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Common paths to suggest based on the URL pattern
  const suggestPaths = () => {
    const path = location.pathname.toLowerCase();
    
    if (path.includes("profile")) {
      return (
        <Button variant="outline" asChild className="w-full">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      );
    }
    
    if (path.includes("product") || path.includes("item")) {
      return (
        <Button variant="outline" asChild className="w-full">
          <Link to="/marketplace">
            <Search className="mr-2 h-4 w-4" />
            Browse Marketplace
          </Link>
        </Button>
      );
    }
    
    if (path.includes("wishlist") || path.includes("gift")) {
      return (
        <Button variant="outline" asChild className="w-full">
          <Link to="/wishlists">
            <Search className="mr-2 h-4 w-4" />
            View Wishlists
          </Link>
        </Button>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-xl mt-2">
            Oops! Page not found
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="border-t border-b border-gray-100 py-4 my-4">
            <p className="text-sm font-medium mb-2">Looking for something?</p>
            {suggestPaths()}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFound;
