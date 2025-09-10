
// Mock NPM imports for testing
module.exports = {
  'resend@2.0.0': {
    Resend: jest.fn(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
      },
    })),
  },
};
