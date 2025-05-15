
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
import { AuthProvider } from "@/contexts/auth";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { ThemeProvider } from './contexts/theme/ThemeProvider';
import Marketplace from "./pages/Marketplace";
import { CartProvider } from "@/contexts/CartContext";
import Wishlists from "./pages/Wishlists"; // <-- import Wishlists page

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider>
            <CartProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/wishlists" element={<Wishlists />} /> {/* <-- add this route */}
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

