
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import TestZincOrder from "./pages/TestZincOrder";
import TrunklineLogin from "./pages/TrunklineLogin";
import Trunkline from "./pages/Trunkline";
import { AuthProvider } from "@/contexts/auth/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { ProductProvider } from "@/contexts/ProductContext";

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering with providers");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProfileProvider>
            <ProductProvider>
              <CartProvider>
                <Toaster />
                <BrowserRouter>
                  <Routes>
                    {navItems.map(({ to, page }) => (
                      <Route key={to} path={to} element={page} />
                    ))}
                    <Route path="/test-zinc-order" element={<TestZincOrder />} />
                    <Route path="/trunkline-login" element={<TrunklineLogin />} />
                    <Route path="/trunkline/*" element={<Trunkline />} />
                  </Routes>
                </BrowserRouter>
              </CartProvider>
            </ProductProvider>
          </ProfileProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
