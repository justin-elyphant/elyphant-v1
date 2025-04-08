
import { renderHook, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useProfileCompletion } from "../useProfileCompletion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

// Mock auth context
jest.mock("@/contexts/auth", () => ({
  useAuth: jest.fn(),
}));

// Mock supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

describe("useProfileCompletion", () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it("should redirect to profile setup when profile is incomplete", async () => {
    // Mock user is logged in
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
      isDebugMode: false
    });

    // Mock incomplete profile (missing required fields)
    const mockData = {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      // Missing dob, shipping_address, and gift_preferences
    };
    
    (supabase.from().select().eq().single as jest.Mock).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => useProfileCompletion(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith("/profile-setup");
    expect(result.current.isComplete).toBe(false);
  });

  it("should not redirect when profile is complete", async () => {
    // Mock user is logged in
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-user-id" },
      isDebugMode: false
    });

    // Mock complete profile with all required fields
    const mockData = {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      dob: "01-01",
      shipping_address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zipCode: "12345",
        country: "USA"
      },
      gift_preferences: [{ category: "Books", importance: "high" }],
      data_sharing_settings: {
        dob: "friends",
        shipping_address: "private",
        gift_preferences: "public"
      }
    };
    
    (supabase.from().select().eq().single as jest.Mock).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => useProfileCompletion(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.isComplete).toBe(true);
  });
});
