
// Import and re-export types from profile.ts to ensure they're available
import { Profile, ShippingAddress, GiftPreference, ImportantDate } from './profile';

// Make them available globally
declare global {
  interface Window {
    Profile: typeof Profile;
    ShippingAddress: typeof ShippingAddress;
    GiftPreference: typeof GiftPreference;
    ImportantDate: typeof ImportantDate;
  }
}

// Re-export for module usage
export { Profile, ShippingAddress, GiftPreference, ImportantDate };
