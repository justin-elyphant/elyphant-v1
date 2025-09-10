
// This file mocks external https imports for testing
const mockDenoStd = {
  serve: (handler) => {
    // Mock implementation of serve
    return {
      handler,
      close: () => {},
    };
  },
};

module.exports = {
  'deno.land/std@0.168.0/http/server.ts': mockDenoStd,
  'esm.sh/@supabase/supabase-js@2.42.0': {
    createClient: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
  },
};
