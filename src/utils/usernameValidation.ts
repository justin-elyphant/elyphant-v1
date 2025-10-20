import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a username is already taken by another user
 */
export async function isUsernameTaken(
  username: string,
  currentUserId: string
): Promise<boolean> {
  if (!username || username.trim() === "") {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", username.trim().toLowerCase())
      .neq("id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }

    return data !== null;
  } catch (error) {
    console.error("Username validation error:", error);
    throw error;
  }
}

/**
 * Validate username format
 */
export function validateUsernameFormat(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username || username.trim() === "") {
    return { isValid: false, error: "Username is required" };
  }

  const trimmedUsername = username.trim();

  // Check length
  if (trimmedUsername.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }

  if (trimmedUsername.length > 30) {
    return { isValid: false, error: "Username must be less than 30 characters" };
  }

  // Check format (alphanumeric, underscores, hyphens only)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens",
    };
  }

  // Check that it doesn't start or end with special characters
  if (/^[-_]|[-_]$/.test(trimmedUsername)) {
    return {
      isValid: false,
      error: "Username cannot start or end with special characters",
    };
  }

  return { isValid: true };
}
