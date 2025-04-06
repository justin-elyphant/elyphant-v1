
import { handleVerificationEmail } from "../handlers/emailHandler";
import { generateVerificationCode, isTestEmail } from "../utils/verification";
import { storeVerificationCode } from "../services/dbService";
import { sendEmailWithRetry } from "../utils/email";
import { createSuccessResponse, createErrorResponse, createRateLimitErrorResponse } from "../utils/responses";

// Mock dependencies
jest.mock("../utils/verification");
jest.mock("../services/dbService");
jest.mock("../utils/email");
jest.mock("../utils/responses");

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.ENVIRONMENT = "test";
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Set up default mock implementations
  (generateVerificationCode as jest.Mock).mockReturnValue("123456");
  (isTestEmail as jest.Mock).mockImplementation((email: string) => {
    return email.includes("test@") || email.includes("+test") || email.includes("example.com");
  });
  (storeVerificationCode as jest.Mock).mockResolvedValue(true);
  (sendEmailWithRetry as jest.Mock).mockResolvedValue({ success: true, data: { id: "test-email-id" } });
  (createSuccessResponse as jest.Mock).mockImplementation((data) => ({ 
    body: JSON.stringify({ success: true, data }),
    status: 200
  }));
  (createErrorResponse as jest.Mock).mockImplementation((message, reason, status = 400) => ({ 
    body: JSON.stringify({ error: message, success: false, reason }),
    status
  }));
  (createRateLimitErrorResponse as jest.Mock).mockReturnValue({ 
    body: JSON.stringify({ error: "Rate limit", success: false, rateLimited: true }),
    status: 429
  });
});

afterEach(() => {
  process.env = originalEnv;
});

describe("handleVerificationEmail", () => {
  // Helper to create a mock Request
  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      method: "POST"
    } as unknown as Request;
  };

  test("should handle test email in development environment", async () => {
    // Arrange
    const mockRequest = createMockRequest({ 
      email: "test@example.com", 
      name: "Test User" 
    });
    process.env.ENVIRONMENT = "development";
    (isTestEmail as jest.Mock).mockReturnValue(true);

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(isTestEmail).toHaveBeenCalledWith("test@example.com");
    expect(generateVerificationCode).toHaveBeenCalled();
    expect(storeVerificationCode).toHaveBeenCalledWith("test@example.com", "123456");
    expect(storeVerificationCode).toHaveBeenCalledWith("test@example.com", "123456");
    expect(sendEmailWithRetry).not.toHaveBeenCalled();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty("code", "123456");
    expect(responseData.data).toHaveProperty("testBypass", true);
  });

  test("should handle regular email successfully", async () => {
    // Arrange
    const mockRequest = createMockRequest({ 
      email: "real.user@gmail.com", 
      name: "Real User" 
    });
    (isTestEmail as jest.Mock).mockReturnValue(false);

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(isTestEmail).toHaveBeenCalledWith("real.user@gmail.com");
    expect(generateVerificationCode).toHaveBeenCalled();
    expect(storeVerificationCode).toHaveBeenCalledWith("real.user@gmail.com", "123456");
    expect(sendEmailWithRetry).toHaveBeenCalledWith("real.user@gmail.com", "Real User", "123456");
    expect(responseData.success).toBe(true);
  });

  test("should return 400 for missing email", async () => {
    // Arrange
    const mockRequest = createMockRequest({ name: "No Email" });

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBeDefined();
    expect(response.status).toBe(400);
  });

  test("should handle database rate limiting", async () => {
    // Arrange
    const mockRequest = createMockRequest({ 
      email: "real.user@gmail.com", 
      name: "Rate Limited User" 
    });
    (isTestEmail as jest.Mock).mockReturnValue(false);
    (storeVerificationCode as jest.Mock).mockResolvedValue(false);

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(storeVerificationCode).toHaveBeenCalledWith("real.user@gmail.com", "123456");
    expect(sendEmailWithRetry).not.toHaveBeenCalled();
    expect(responseData.success).toBe(false);
    expect(responseData.rateLimited).toBe(true);
    expect(response.status).toBe(429);
  });

  test("should handle email sending failures", async () => {
    // Arrange
    const mockRequest = createMockRequest({ 
      email: "real.user@gmail.com", 
      name: "Failed Email User" 
    });
    (isTestEmail as jest.Mock).mockReturnValue(false);
    (sendEmailWithRetry as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: new Error("Email send failed") 
    });

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(storeVerificationCode).toHaveBeenCalledWith("real.user@gmail.com", "123456");
    expect(sendEmailWithRetry).toHaveBeenCalledWith("real.user@gmail.com", "Failed Email User", "123456");
    expect(responseData.success).toBe(false);
    expect(response.status).toBe(500);
  });

  test("should handle JSON parse errors", async () => {
    // Arrange
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      headers: {
        get: jest.fn().mockReturnValue("application/json"),
      },
      method: "POST"
    } as unknown as Request;

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain("Invalid JSON");
    expect(response.status).toBe(400);
  });

  test("should handle content type validation", async () => {
    // Arrange
    const mockRequest = {
      headers: {
        get: jest.fn().mockReturnValue("text/plain"),
      },
      method: "POST"
    } as unknown as Request;

    // Act
    const response = await handleVerificationEmail(mockRequest);
    const responseData = await response.json();

    // Assert
    expect(responseData.success).toBe(false);
    expect(responseData.error).toContain("Content-Type must be application/json");
    expect(response.status).toBe(400);
  });
});

describe("verification utility functions", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.dontMock("../utils/verification");
  });

  // Import the actual functions for these tests
  const { generateVerificationCode: actualGenerateCode, isTestEmail: actualIsTestEmail } = jest.requireActual("../utils/verification");

  test("generateVerificationCode should generate a 6-digit code", () => {
    const code = actualGenerateCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  test("isTestEmail should correctly identify test emails", () => {
    expect(actualIsTestEmail("test@example.com")).toBe(true);
    expect(actualIsTestEmail("user+test@gmail.com")).toBe(true);
    expect(actualIsTestEmail("demo@somewhere.com")).toBe(true);
    expect(actualIsTestEmail("justncmeeks@gmail.com")).toBe(true);
    expect(actualIsTestEmail("real.person@gmail.com")).toBe(false);
  });
});
