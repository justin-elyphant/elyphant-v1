
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ProfileSetupFlow from "../ProfileSetupFlow";

// Mock the auth context
jest.mock("@/contexts/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ProfileSetupFlow", () => {
  const onCompleteMock = jest.fn();
  const onSkipMock = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
    });

    // Mock successful profile update
    (supabase.from().update().eq().select().single as jest.Mock).mockResolvedValue({
      data: { id: "test-user-id" },
      error: null,
    });
  });

  it("renders the profile setup flow with proper steps", () => {
    render(<ProfileSetupFlow onComplete={onCompleteMock} onSkip={onSkipMock} />);
    
    expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("This information helps us personalize your gifting experience")).toBeInTheDocument();
  });

  it("allows navigation through steps", async () => {
    render(<ProfileSetupFlow onComplete={onCompleteMock} onSkip={onSkipMock} />);
    
    // First step (Basic Info)
    expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    
    // Navigate to next step
    fireEvent.click(screen.getByText("Next Step"));
    
    // Second step (Birthday)
    await waitFor(() => {
      expect(screen.getByText("When is your birthday?")).toBeInTheDocument();
    });
  });

  it("completes the profile setup process", async () => {
    render(<ProfileSetupFlow onComplete={onCompleteMock} onSkip={onSkipMock} />);
    
    // Fill out name in first step
    fireEvent.change(screen.getByPlaceholderText("Your full name"), {
      target: { value: "John Doe" }
    });
    
    // Navigate through all steps
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText("Next Step"));
      await waitFor(() => {
        // Just wait for the next step to render
      });
    }
    
    // Now we should be at the final step
    expect(screen.getByText("Complete Setup")).toBeInTheDocument();
    
    // Complete the setup
    fireEvent.click(screen.getByText("Complete Setup"));
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(onCompleteMock).toHaveBeenCalled();
    });
  });

  it("allows skipping the profile setup", () => {
    render(<ProfileSetupFlow onComplete={onCompleteMock} onSkip={onSkipMock} />);
    
    // Skip the setup
    fireEvent.click(screen.getByText("Skip for now"));
    
    expect(onSkipMock).toHaveBeenCalled();
  });
});
