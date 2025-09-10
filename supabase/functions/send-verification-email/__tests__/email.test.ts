
import { createVerificationEmailContent, sendEmailWithRetry, isRateLimitError } from "../utils/email";

// Mock Resend
jest.mock("npm:resend@2.0.0", () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({ id: "mock-email-id" })
        }
      };
    })
  };
});

describe("Email utility functions", () => {
  test("createVerificationEmailContent should generate HTML with verification code", () => {
    const html = createVerificationEmailContent("Test User", "123456");
    expect(html).toContain("Test User");
    expect(html).toContain("123456");
    expect(html).toContain("Elyphant");
    expect(html).toContain("verification code");
  });

  test("isRateLimitError should identify rate limit errors", () => {
    const rateLimitError1 = { message: "Too many requests. Rate limit exceeded.", statusCode: 429 };
    const rateLimitError2 = { message: "Rate limit reached", statusCode: 400 };
    const otherError = { message: "Invalid request", statusCode: 400 };
    
    expect(isRateLimitError(rateLimitError1)).toBe(true);
    expect(isRateLimitError(rateLimitError2)).toBe(true);
    expect(isRateLimitError(otherError)).toBe(false);
  });

  test("sendEmailWithRetry should retry on rate limit errors", async () => {
    // Mock implementation for testing retry logic
    const mockSend = jest.fn();
    mockSend.mockRejectedValueOnce({ message: "Rate limit exceeded", statusCode: 429 });
    mockSend.mockResolvedValueOnce({ id: "retry-success" });
    
    const resendMock = {
      emails: { send: mockSend }
    };
    
    // Replace the mocked resend with our test-specific mock
    jest.mock("npm:resend@2.0.0", () => {
      return {
        Resend: jest.fn().mockImplementation(() => resendMock)
      };
    });
    
    const result = await sendEmailWithRetry("test@example.com", "Retry User", "789012", 2);
    
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "retry-success" });
  });
});
