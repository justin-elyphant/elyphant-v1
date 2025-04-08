
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toBeInTheDocument();
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add the proper types for jest-dom
import '@testing-library/jest-dom/extend-expect';

// Mock implementations
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

// Mock window.matchMedia - required by some components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock debug mode hook to always return true for bypassing auth in tests
jest.mock('@/hooks/useDebugMode', () => ({
  useDebugMode: jest.fn().mockReturnValue([
    true, 
    { bypassAuth: true, mockUserId: 'test-user-id', mockUserEmail: 'test@example.com' }
  ]),
}));

// Mock implementation for React Testing Library functions
jest.mock('@testing-library/react', () => {
  const originalModule = jest.requireActual('@testing-library/react');
  return {
    ...originalModule,
    render: (...args) => {
      if (args.length === 0) {
        throw new Error('render called with no arguments');
      }
      return originalModule.render(...args);
    },
    screen: {
      ...originalModule.screen,
      getByText: (text) => {
        if (!text) {
          throw new Error('getByText called with no arguments');
        }
        return originalModule.screen.getByText(text);
      },
      getByTestId: (testId) => {
        if (!testId) {
          throw new Error('getByTestId called with no arguments');
        }
        return originalModule.screen.getByTestId(testId);
      }
    }
  };
});
