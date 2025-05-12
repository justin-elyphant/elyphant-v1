
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthProvider';
import { ProfileProvider } from './contexts/profile/ProfileContext';
import { ProductProvider } from './contexts/ProductContext';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Connections from './pages/Connections';
import OnboardingPage from './pages/OnboardingPage';
import NotificationsPage from "./pages/Notifications";
import { NotificationsProvider } from "./contexts/notifications/NotificationsContext";

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ProductProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/dashboard"
                  element={
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  }
                />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/connections"
                  element={
                    <MainLayout>
                      <Connections />
                    </MainLayout>
                  }
                />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                {/* Redirect any unknown routes to the homepage */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </NotificationsProvider>
        </ProductProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
