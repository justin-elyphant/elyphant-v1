
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProfileSetup from "./pages/ProfileSetup";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./contexts/theme/ThemeProvider";
import { AuthProvider } from "./contexts/auth";
import { ProfileProvider } from "./contexts/profile/ProfileContext";
import { NotificationsProvider } from "./contexts/notifications/NotificationsContext";
import { Toaster } from "sonner";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster position="top-right" closeButton richColors />
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
