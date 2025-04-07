
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";
import ProfileSetup from "@/pages/ProfileSetup";
import { useProfileCompletion } from "@/hooks/profile/useProfileCompletion";

// Mock the hooks
jest.mock("@/contexts/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/profile/useProfileCompletion", () => ({
  useProfileCompletion: jest.fn(),
}));

// Mock Supabase
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// Mock components that aren't relevant for this test
jest.mock("@/components/dashboard/DashboardHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}));

jest.mock("@/components/dashboard/DashboardGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-grid">Dashboard Grid</div>,
}));

describe("Profile Setup Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
    });
  });
  
  it("redirects to profile setup when profile is incomplete", async () => {
    // Mock profile is incomplete
    (useProfileCompletion as jest.Mock).mockReturnValue({
      isComplete: false,
      loading: false,
    });
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should render loading first
    expect(screen.queryByTestId("dashboard-grid")).not.toBeInTheDocument();
    
    // Then redirect to profile setup
    await waitFor(() => {
      expect(useProfileCompletion).toHaveBeenCalled();
    });
  });
  
  it("allows access to dashboard when profile is complete", async () => {
    // Mock profile is complete
    (useProfileCompletion as jest.Mock).mockReturnValue({
      isComplete: true,
      loading: false,
    });
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
    });
  });
});
