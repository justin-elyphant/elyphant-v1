
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import ProfileSetup from "./pages/ProfileSetup";
import Messages from "./pages/Messages";
import Connections from "./pages/Connections";
import { AuthProvider } from "@/contexts/auth";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { ThemeProvider } from './contexts/theme/ThemeProvider';
import Marketplace from "./pages/Marketplace";
import { CartProvider } from "@/contexts/CartContext";
import Wishlists from "./pages/Wishlists";
import AboutUs from "./pages/AboutUs";
import ScrollToTop from "@/components/layout/ScrollToTop";
import OnboardingGiftorFlow from "@/components/onboarding/OnboardingGiftorFlow";
import Gifting from "./pages/Gifting";
import Cart from "./pages/Cart";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:connectionId" element={<Messages />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlists" element={<Wishlists />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/onboarding-gift" element={<OnboardingGiftorFlow />} />
                <Route path="/gifting" element={<Gifting />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
