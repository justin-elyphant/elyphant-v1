
import { storeVerificationCode } from "../services/dbService";

// Mock Supabase client
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockInsert = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockGt = jest.fn();

const mockSupabase = {
  from: jest.fn().mockReturnValue({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
    update: mockUpdate.mockReturnThis(),
    insert: mockInsert,
    order: mockOrder.mockReturnThis(),
    limit: mockLimit.mockReturnThis(),
    gt: mockGt.mockReturnThis()
  })
};

jest.mock("https://esm.sh/@supabase/supabase-js@2.42.0", () => {
  return {
    createClient: jest.fn().mockReturnValue(mockSupabase)
  };
});

describe("Database Service functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("storeVerificationCode should create a new code when none exists", async () => {
    // Mock no existing code
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        eq: mockEq.mockImplementation(() => ({
          gt: mockGt.mockImplementation(() => ({
            order: mockOrder.mockImplementation(() => ({
              limit: mockLimit.mockImplementation(() => ({
                single: mockSingle.mockRejectedValue({ message: "No rows found" })
              }))
            }))
          }))
        }))
      }))
    }));
    
    mockInsert.mockResolvedValue({ error: null });
    
    const result = await storeVerificationCode("new@example.com", "123456");
    
    expect(result).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      email: "new@example.com",
      code: "123456",
      expires_at: expect.any(String),
      last_resend_at: expect.any(String),
      resend_count: 0,
    });
  });

  test("storeVerificationCode should update existing code when one exists", async () => {
    // Mock existing code
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        eq: mockEq.mockImplementation(() => ({
          gt: mockGt.mockImplementation(() => ({
            order: mockOrder.mockImplementation(() => ({
              limit: mockLimit.mockImplementation(() => ({
                single: mockSingle.mockResolvedValue({
                  data: {
                    id: "existing-code-id",
                    resend_count: 1,
                    last_resend_at: new Date(Date.now() - 120000).toISOString()
                  },
                  error: null
                })
              }))
            }))
          }))
        }))
      }))
    }));
    
    mockUpdate.mockImplementation(() => ({
      eq: mockEq.mockResolvedValue({ error: null })
    }));
    
    const result = await storeVerificationCode("existing@example.com", "654321");
    
    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "existing-code-id");
  });

  test("storeVerificationCode should implement rate limiting for resends", async () => {
    // Mock recently sent code (under 1 minute ago)
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        eq: mockEq.mockImplementation(() => ({
          gt: mockGt.mockImplementation(() => ({
            order: mockOrder.mockImplementation(() => ({
              limit: mockLimit.mockImplementation(() => ({
                single: mockSingle.mockResolvedValue({
                  data: {
                    id: "rate-limited-code",
                    resend_count: 1,
                    last_resend_at: new Date(Date.now() - 30000).toISOString() // 30 seconds ago
                  },
                  error: null
                })
              }))
            }))
          }))
        }))
      }))
    }));
    
    const result = await storeVerificationCode("ratelimited@example.com", "111111");
    
    expect(result).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("storeVerificationCode should prevent more than 5 resends", async () => {
    // Mock code with max resend count
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        eq: mockEq.mockImplementation(() => ({
          gt: mockGt.mockImplementation(() => ({
            order: mockOrder.mockImplementation(() => ({
              limit: mockLimit.mockImplementation(() => ({
                single: mockSingle.mockResolvedValue({
                  data: {
                    id: "max-resends-code",
                    resend_count: 5, // Max resends reached
                    last_resend_at: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
                  },
                  error: null
                })
              }))
            }))
          }))
        }))
      }))
    }));
    
    const result = await storeVerificationCode("maxresend@example.com", "222222");
    
    expect(result).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test("storeVerificationCode should handle database errors", async () => {
    // Mock database error
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        eq: mockEq.mockImplementation(() => ({
          gt: mockGt.mockImplementation(() => ({
            order: mockOrder.mockImplementation(() => ({
              limit: mockLimit.mockImplementation(() => ({
                single: mockSingle.mockRejectedValue({ message: "Database error" })
              }))
            }))
          }))
        }))
      }))
    }));
    
    const result = await storeVerificationCode("error@example.com", "333333");
    
    expect(result).toBe(false);
  });
});
