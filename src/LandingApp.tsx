import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/layout/ScrollToTop";
import HandwrapsLP from "./pages/lp/HandwrapsLP";

export default function LandingApp() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/lp/handwraps" element={<HandwrapsLP />} />
          <Route path="*" element={<Navigate to="/lp/handwraps" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}